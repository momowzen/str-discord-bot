const { translateText, detectLanguage } = require('../services/translator');
const { extractTextFromImage } = require('../services/ocr');
const { getFlag } = require('../utils/languages');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const channelSetting = await client.db.getChannelSetting(message.channelId);
    if (!channelSetting?.auto_translate_lang) return;

    let textToTranslate = message.content;

    const imageAttachments = message.attachments.filter(a => a.contentType?.startsWith('image/'));
    if (imageAttachments.size > 0) {
      for (const [, attachment] of imageAttachments) {
        const extracted = await extractTextFromImage(attachment.url);
        if (extracted) {
          textToTranslate += (textToTranslate ? '\n' : '') + extracted;
        }
      }
    }

    if (!textToTranslate) return;

    const langs = channelSetting.auto_translate_lang.includes(',')
      ? channelSetting.auto_translate_lang.split(',')
      : [channelSetting.auto_translate_lang];

    const detected = await detectLanguage(textToTranslate);
    if (!detected) return;

    if (langs.length === 1 && detected !== langs[0]) {
      const result = await translateText(textToTranslate, langs[0], detected);
      if (result.text && result.text !== textToTranslate) {
        await message.reply({
          embeds: [{
            color: 0x5865F2,
            description: `${getFlag(langs[0])}\n${result.text}`,
          }],
          allowedMentions: { repliedUser: false },
        });
      }
    } else if (langs.length > 1) {
      const parts = [];
      for (const targetLang of langs) {
        if (targetLang === detected) continue;
        const result = await translateText(textToTranslate, targetLang, detected);
        if (result.text && result.text !== textToTranslate) {
          parts.push(`${getFlag(targetLang)}\n${result.text}`);
        }
      }
      if (parts.length > 0) {
        await message.reply({
          embeds: [{
            color: 0x5865F2,
            description: parts.join('\n\n'),
          }],
          allowedMentions: { repliedUser: false },
        });
      }
    }
  },
};
