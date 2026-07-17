const { translateText, detectLanguage } = require('../services/translator');
const { getFlag } = require('../utils/languages');

const MENTION_RE = /@(everyone|here)|<[@#][!&]?\d+>|<a?:\w+:\d+>/g;

function preserveMentions(text, store) {
  return text.replace(MENTION_RE, m => {
    const idx = store.push(m);
    return `⟪M${idx - 1}⟫`;
  });
}

function restoreMentions(text, store) {
  return text.replace(/⟪M(\d+)⟫/g, (_, i) => store[+i] || '');
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const channelSetting = await client.db.getChannelSetting(message.channelId);
    if (channelSetting?.auto_translate_lang === '__disabled__') return;

    const mentions = [];
    const textToTranslate = preserveMentions(message.content, mentions);
    if (!textToTranslate) return;

    const langs = channelSetting?.auto_translate_lang
      ? channelSetting.auto_translate_lang.includes(',')
        ? channelSetting.auto_translate_lang.split(',')
        : [channelSetting.auto_translate_lang]
      : ['en', 'ja', 'ko'];

    const detected = await detectLanguage(textToTranslate);
    if (!detected) return;

    if (langs.length === 1 && detected !== langs[0]) {
      const result = await translateText(textToTranslate, langs[0], detected);
      if (result.text && result.text !== textToTranslate) {
        const translated = restoreMentions(result.text, mentions);
        await message.reply({
          embeds: [{
            color: 0x5865F2,
            description: `${getFlag(langs[0])}\n${translated}`,
          }],
          allowedMentions: { parse: [] },
        });
      }
    } else if (langs.length > 1) {
      const parts = [];
      for (const targetLang of langs) {
        if (targetLang === detected) continue;
        const result = await translateText(textToTranslate, targetLang, detected);
        if (result.text && result.text !== textToTranslate) {
          parts.push(`${getFlag(targetLang)}\n${restoreMentions(result.text, mentions)}`);
        }
      }
      if (parts.length > 0) {
        await message.reply({
          embeds: [{
            color: 0x5865F2,
            description: parts.join('\n\n'),
          }],
          allowedMentions: { parse: [] },
        });
      }
    }
  },
};
