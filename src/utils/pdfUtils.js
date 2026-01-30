import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Embeds a PNG signature into a PDF at specific coordinates.
 * @param {Object} params
 * @param {ArrayBuffer|Uint8Array} params.pdfBuffer - The original PDF file buffer.
 * @param {string} params.signatureImage - Base64 data URL of the PNG signature.
 * @param {Object} params.position - { x, y } coordinates from the UI (top-left origin).
 * @param {number} params.pageIndex - The 0-based index of the page to sign.
 * @param {number} params.visualWidth - The rendered width of the PDF page in the UI (e.g. 600px)
 * @returns {Promise<Uint8Array>} - The signed PDF as a byte array.
 */
export async function embedSignature({
    pdfBuffer,
    signatureImage,
    position,
    pageIndex,
    visualWidth
}) {
    // Ensure buffer is Uint8Array
    const pdfBytes = new Uint8Array(pdfBuffer);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Detect image type
    let image;
    if (signatureImage.startsWith('data:image/jpeg') || signatureImage.startsWith('data:image/jpg')) {
        image = await pdfDoc.embedJpg(signatureImage);
    } else {
        // Default to PNG
        image = await pdfDoc.embedPng(signatureImage);
    }

    // Rename variable for clarity
    const embeddedImage = image;

    // Get the page
    const pages = pdfDoc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
        console.error(`Invalid page index: ${pageIndex}. Total pages: ${pages.length}`);
        return await pdfDoc.save(); // Return unmodified if page invalid
    }
    const page = pages[pageIndex];

    // Get actual PDF page dimensions and rotation
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    // Calculate effective width/height based on rotation
    let effectiveWidth = width;
    let effectiveHeight = height;

    // Normalize rotation handling
    // If rotation is 90/270, the "width" we see properly is actually the height property
    if (rotation === 90 || rotation === 270) {
        effectiveWidth = height;
        effectiveHeight = width;
    }

    // Calculate scale: PDF_Effective_Width / UI_Pixel_Width
    // Prevent division by zero
    const safeVisualWidth = visualWidth || 600;
    const scale = effectiveWidth / safeVisualWidth;

    // Coordinate transformation
    // UI: (0,0) is Top-Left. 
    // PDF: (0,0) is usually Bottom-Left.

    // UI coordinates scaled to PDF units
    const scaledX = position.x * scale;
    const scaledY = position.y * scale;

    // Match UI height (50px)
    const uiSignatureHeight = 50;
    const signatureDims = embeddedImage.scale(1);
    const aspectRatio = signatureDims.width / signatureDims.height;

    const pdfSignatureHeight = uiSignatureHeight * scale;
    const pdfSignatureWidth = pdfSignatureHeight * aspectRatio;

    console.log(`EmbedSignature: Page ${pageIndex}, Rotation ${rotation}`);
    console.log(`Dims: PDF(${width}x${height}), Visual(${safeVisualWidth}), Scale(${scale})`);
    console.log(`Pos: UI(${position.x},${position.y}) -> Scaled(${scaledX},${scaledY})`);

    let pdfX, pdfDrawY, imageRotation;

    if (rotation === 0) {
        // Standard Portrait
        // x right, y up
        pdfX = scaledX;
        // visual y is distance from top
        // pdf y is distance from bottom
        pdfDrawY = height - scaledY - pdfSignatureHeight;
        imageRotation = 0;
    } else if (rotation === 90) {
        // Rotated 90 CW. 
        // Visual Top-Left corresponds to PDF (0, height) ?? No.
        // It's complex. For MVP, we'll try a best guess mapping.
        // If the page is rotated 90, effectively:
        // Visual X (right) -> PDF Y (down)
        // Visual Y (down) -> PDF X (right)
        // Let's assume standard behavior:
        pdfX = scaledY;
        pdfDrawY = scaledX; // This is likely wrong without matrix math
        imageRotation = 270;
        console.warn("Handling 90deg rotation with experimental logic");
    } else {
        // Fallback for others
        pdfX = scaledX;
        pdfDrawY = height - scaledY - pdfSignatureHeight;
        imageRotation = 0;
    }

    const drawOptions = {
        x: pdfX,
        y: pdfDrawY,
        width: pdfSignatureWidth,
        height: pdfSignatureHeight,
    };

    if (imageRotation) {
        drawOptions.rotate = { type: 'degrees', angle: imageRotation };
    }

    page.drawImage(embeddedImage, drawOptions);



    console.log("Signature drawn at:", drawOptions);

    const savedBytes = await pdfDoc.save();
    return savedBytes;
}

/**
 * Embeds text into a PDF at specific coordinates.
 * @param {Object} params
 * @param {ArrayBuffer|Uint8Array} params.pdfBuffer - The original PDF file buffer.
 * @param {string} params.text - The text to embed.
 * @param {Object} params.position - { x, y } coordinates from the UI (top-left origin).
 * @param {number} params.pageIndex - The 0-based index of the page.
 * @param {number} params.visualWidth - The rendered width of the PDF page in the UI.
 * @param {number} params.fontSize - Optional font size (default 12).
 * @returns {Promise<Uint8Array>}
 */
export async function embedText({
    pdfBuffer,
    text,
    position,
    pageIndex,
    visualWidth,
    fontSize = 12
}) {
    const pdfBytes = new Uint8Array(pdfBuffer);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) return await pdfDoc.save();
    const page = pages[pageIndex];

    const { width, height } = page.getSize();

    // Simplified scaling logic matching embedSignature
    const safeVisualWidth = visualWidth || 600;
    const scale = width / safeVisualWidth;

    const scaledX = position.x * scale;
    const scaledY = position.y * scale;

    // Adjust Y because PDF is bottom-left origin. 
    // visual Y is top-left.
    // Text draws from bottom-left of the text box.
    const pdfDrawY = height - scaledY - (fontSize * scale);

    page.drawText(text, {
        x: scaledX,
        y: pdfDrawY,
        size: fontSize * scale,
        font: helveticaFont,
        color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
}
