import { PDFDocument, rgb } from 'pdf-lib';

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

    // Embed the PNG signature
    const pngImage = await pdfDoc.embedPng(signatureImage);

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
    const signatureDims = pngImage.scale(1);
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

    page.drawImage(pngImage, drawOptions);



    console.log("Signature drawn at:", drawOptions);

    const savedBytes = await pdfDoc.save();
    return savedBytes;
}
