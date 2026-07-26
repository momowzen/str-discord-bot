const deepl = require('deepl-node');

const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

async function translateText(text, targetLang, sourceLang) {
  try {
    const src = sourceLang && sourceLang !== 'auto' ? sourceLang.toUpperCase() : null;
    const result = await translator.translateText(text, src, targetLang.toUpperCase());
    const detected = sourceLang === 'auto' ? null : (sourceLang || null);
    return { text: result.text, detectedLang: detected || result.detectedSourceLang?.toLowerCase() || null };
  } catch (err) {
    console.error('Translation error:', err.message);
    return { text: null, detectedLang: null };
  }
}

async function detectLanguage(text) {
  try {
    const result = await translator.translateText(text, null, 'EN');
    return result.detectedSourceLang?.toLowerCase() || null;
  } catch (err) {
    console.error('Detection error:', err.message);
    return null;
  }
}

module.exports = { translateText, detectLanguage };