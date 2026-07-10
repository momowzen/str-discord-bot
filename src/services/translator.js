const { translate, detect } = require('google-translate-api-x');

async function translateText(text, targetLang, sourceLang) {
  const opts = { to: targetLang };
  if (sourceLang && sourceLang !== 'auto') opts.from = sourceLang;
  try {
    const result = await translate(text, opts);
    const detected = typeof result.language === 'string'
      ? result.language
      : result.language?.language || sourceLang || 'auto';
    return { text: result.text, detectedLang: detected };
  } catch (err) {
    console.error('Translation error:', err.message);
    return { text: null, detectedLang: null };
  }
}

async function detectLanguage(text) {
  try {
    const result = await detect(text);
    return typeof result.language === 'string'
      ? result.language
      : result.language?.language || null;
  } catch (err) {
    console.error('Detection error:', err.message);
    return null;
  }
}

module.exports = { translateText, detectLanguage };
