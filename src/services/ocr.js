const { createWorker } = require('tesseract.js');

let worker = null;

async function getWorker() {
  if (!worker) {
    worker = await createWorker('eng');
  }
  return worker;
}

async function extractTextFromImage(imageUrl) {
  try {
    const w = await getWorker();
    const { data: { text } } = await w.recognize(imageUrl);
    return text.trim();
  } catch (err) {
    console.error('OCR error:', err.message);
    return '';
  }
}

async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

module.exports = { extractTextFromImage, terminateWorker };
