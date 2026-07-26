const deepl = require('deepl-node');

const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

const CODE_MAP = {
  en: 'en-US',
  pt: 'pt-PT',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  no: 'nb',
};

const REV_MAP = {
  'en-us': 'en', 'en-gb': 'en',
  'pt-pt': 'pt', 'pt-br': 'pt',
  zh: 'zh-CN',
  nb: 'no',
};

function toTarget(code) {
  return (CODE_MAP[code] || code).toUpperCase();
}

function toSource(code) {
  const lower = code.toLowerCase();
  return (REV_MAP[lower] || lower).toUpperCase();
}

async function translateText(text, targetLang, sourceLang) {
  try {
    const src = sourceLang && sourceLang !== 'auto' ? toSource(sourceLang) : null;
    const result = await translator.translateText(text, src, toTarget(targetLang));
    const detected = sourceLang === 'auto' ? null : (sourceLang || null);
    return { text: result.text, detectedLang: detected || result.detectedSourceLang?.toLowerCase() || null };
  } catch (err) {
    console.error('Translation error:', err.message);
    return { text: null, detectedLang: null };
  }
}

async function detectLanguage(text) {
  try {
    const result = await translator.translateText(text, null, 'EN-US');
    const raw = result.detectedSourceLang?.toLowerCase() || null;
    return REV_MAP[raw] || raw;
  } catch (err) {
    console.error('Detection error:', err.message);
    return null;
  }
}

module.exports = { translateText, detectLanguage };