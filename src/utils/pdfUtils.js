import { PDFDocument } from 'pdf-lib';

/**
 * Embeds a PNG signature into a PDF at specific coordinates.
 * @param {Object} params
 * @param {ArrayBuffer} params.pdfBuffer - The original PDF file buffer.
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
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Embed the PNG signature
    const pngImage = await pdfDoc.embedPng(signatureImage);

    // Get the page
    const pages = pdfDoc.getPages();
    const page = pages[pageIndex];

    // Get actual PDF page dimensions
    const { width, height } = page.getSize();

    // Calculate scale: PDF_Point_Width / UI_Pixel_Width
    const scale = width / visualWidth;

    // Coordinate transformation
    // UI: (0,0) is Top-Left. 
    // PDF: (0,0) is usually Bottom-Left.

    // We need to scale the UI x,y to PDF x,y
    const pdfX = position.x * scale;

    // The signature onscreen is also scaled visually.
    // In UI, it's 64px height (h-16).
    const uiSignatureHeight = 64;
    const signatureDims = pngImage.scale(1);
    const aspectRatio = signatureDims.width / signatureDims.height;

    const pdfSignatureHeight = uiSignatureHeight * scale;
    const pdfSignatureWidth = pdfSignatureHeight * aspectRatio;

    // pdfY calculation:
    // Distance from top in PDF units = position.y * scale
    // y = PageHeight - Distance_From_Top - ImageHeight
    // Note: we must subtract the height of the signature because y is at the bottom of the image
    const pdfDrawY = height - (position.y * scale) - pdfSignatureHeight;

    page.drawImage(pngImage, {
        x: pdfX,
        y: pdfDrawY,
        width: pdfSignatureWidth,
        height: pdfSignatureHeight,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
