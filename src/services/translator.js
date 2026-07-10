const { translate } = require('google-translate-api-x');

async function translateText(text, targetLang, sourceLang) {
  const opts = { to: targetLang };
  if (sourceLang && sourceLang !== 'auto') opts.from = sourceLang;
  try {
    const result = await translate(text, opts);
    const detected = result.from?.language?.iso || sourceLang || 'auto';
    return { text: result.text, detectedLang: detected };
  } catch (err) {
    console.error('Translation error:', err.message);
    return { text: null, detectedLang: null };
  }
}

async function detectLanguage(text) {
  try {
    const result = await translate(text, { to: 'en' });
    return result.from?.language?.iso || null;
  } catch (err) {
    console.error('Detection error:', err.message);
    return null;
  }
}

module.exports = { translateText, detectLanguage };
