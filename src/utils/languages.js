const languages = {
  af: 'Afrikaans', sq: 'Albanian', am: 'Amharic', ar: 'Arabic', hy: 'Armenian',
  az: 'Azerbaijani', eu: 'Basque', be: 'Belarusian', bn: 'Bengali', bs: 'Bosnian',
  bg: 'Bulgarian', ca: 'Catalan', ceb: 'Cebuano', ny: 'Chichewa', 'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)', co: 'Corsican', hr: 'Croatian', cs: 'Czech',
  da: 'Danish', nl: 'Dutch', en: 'English', eo: 'Esperanto', et: 'Estonian',
  tl: 'Filipino', fi: 'Finnish', fr: 'French', fy: 'Frisian', gl: 'Galician',
  ka: 'Georgian', de: 'German', el: 'Greek', gu: 'Gujarati', ht: 'Haitian Creole',
  ha: 'Hausa', haw: 'Hawaiian', he: 'Hebrew', hi: 'Hindi', hmn: 'Hmong',
  hu: 'Hungarian', is: 'Icelandic', ig: 'Igbo', id: 'Indonesian', ga: 'Irish',
  it: 'Italian', ja: 'Japanese', jw: 'Javanese', kn: 'Kannada', kk: 'Kazakh',
  km: 'Khmer', rw: 'Kinyarwanda', ko: 'Korean', ku: 'Kurdish', ky: 'Kyrgyz',
  lo: 'Lao', la: 'Latin', lv: 'Latvian', lt: 'Lithuanian', lb: 'Luxembourgish',
  mk: 'Macedonian', mg: 'Malagasy', ms: 'Malay', ml: 'Malayalam', mt: 'Maltese',
  mi: 'Maori', mr: 'Marathi', mn: 'Mongolian', my: 'Myanmar (Burmese)', ne: 'Nepali',
  no: 'Norwegian', or: 'Odia (Oriya)', ps: 'Pashto', fa: 'Persian', pl: 'Polish',
  pt: 'Portuguese', pa: 'Punjabi', ro: 'Romanian', ru: 'Russian', sm: 'Samoan',
  gd: 'Scots Gaelic', sr: 'Serbian', st: 'Sesotho', sn: 'Shona', sd: 'Sindhi',
  si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian', so: 'Somali', es: 'Spanish',
  su: 'Sundanese', sw: 'Swahili', sv: 'Swedish', tg: 'Tajik', ta: 'Tamil',
  tt: 'Tatar', te: 'Telugu', th: 'Thai', tr: 'Turkish', tk: 'Turkmen',
  uk: 'Ukrainian', ur: 'Urdu', ug: 'Uyghur', uz: 'Uzbek', vi: 'Vietnamese',
  cy: 'Welsh', xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba', zu: 'Zulu',
};

function getLanguageName(code) {
  return languages[code] || code;
}

const langToCountry = {
  af: 'ZA', sq: 'AL', am: 'ET', ar: 'SA', hy: 'AM',
  az: 'AZ', eu: 'ES', be: 'BY', bn: 'BD', bs: 'BA',
  bg: 'BG', ca: 'ES', ceb: 'PH', ny: 'MW', 'zh-CN': 'CN',
  'zh-TW': 'TW', co: 'FR', hr: 'HR', cs: 'CZ',
  da: 'DK', nl: 'NL', en: 'GB', eo: 'EU', et: 'EE',
  tl: 'PH', fi: 'FI', fr: 'FR', fy: 'NL', gl: 'ES',
  ka: 'GE', de: 'DE', el: 'GR', gu: 'IN', ht: 'HT',
  ha: 'NG', haw: 'US', he: 'IL', hi: 'IN', hmn: 'CN',
  hu: 'HU', is: 'IS', ig: 'NG', id: 'ID', ga: 'IE',
  it: 'IT', ja: 'JP', jw: 'ID', kn: 'IN', kk: 'KZ',
  km: 'KH', rw: 'RW', ko: 'KR', ku: 'IQ', ky: 'KG',
  lo: 'LA', la: 'VA', lv: 'LV', lt: 'LT', lb: 'LU',
  mk: 'MK', mg: 'MG', ms: 'MY', ml: 'IN', mt: 'MT',
  mi: 'NZ', mr: 'IN', mn: 'MN', my: 'MM', ne: 'NP',
  no: 'NO', or: 'IN', ps: 'AF', fa: 'IR', pl: 'PL',
  pt: 'PT', pa: 'IN', ro: 'RO', ru: 'RU', sm: 'WS',
  gd: 'GB', sr: 'RS', st: 'LS', sn: 'ZW', sd: 'IN',
  si: 'LK', sk: 'SK', sl: 'SI', so: 'SO', es: 'ES',
  su: 'ID', sw: 'TZ', sv: 'SE', tg: 'TJ', ta: 'IN',
  tt: 'RU', te: 'IN', th: 'TH', tr: 'TR', tk: 'TM',
  uk: 'UA', ur: 'PK', ug: 'CN', uz: 'UZ', vi: 'VN',
  cy: 'GB', xh: 'ZA', yi: 'IL', yo: 'NG', zu: 'ZA',
};

function getFlag(langCode) {
  const cc = langToCountry[langCode];
  if (!cc) return '';
  const a = cc.charCodeAt(0) - 65 + 0x1F1E6;
  const b = cc.charCodeAt(1) - 65 + 0x1F1E6;
  return String.fromCodePoint(a) + String.fromCodePoint(b);
}

module.exports = { languages, getLanguageName, getFlag };
