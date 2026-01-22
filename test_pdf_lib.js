
import { PDFDocument } from 'pdf-lib';

async function test() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([100, 200]); // Width 100, Height 200
    page.setRotation(90);

    const { width, height } = page.getSize();
    const rotation = page.getRotation();

    console.log(`Size: ${width}x${height}, Rotation: ${rotation}`);

    // Draw at 10,10 visual (Top-Left?)
    // If rotated 90, visual top-left might be different in PDF coords.
}

test();
