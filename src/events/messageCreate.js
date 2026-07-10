const { translateText, detectLanguage } = require('../services/translator');
const { getFlag } = require('../utils/languages');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content) return;

    const channelSetting = await client.db.getChannelSetting(message.channelId);
    if (!channelSetting?.auto_translate_lang) return;

    const langs = channelSetting.auto_translate_lang.includes(',')
      ? channelSetting.auto_translate_lang.split(',')
      : [channelSetting.auto_translate_lang];

    const detected = await detectLanguage(message.content);
    if (!detected) return;

    if (langs.length === 1 && detected !== langs[0]) {
      const result = await translateText(message.content, langs[0], detected);
      if (result.text && result.text !== message.content) {
        await message.reply({
          content: `${getFlag(langs[0])}\n${result.text}`,
          allowedMentions: { repliedUser: false },
        });
      }
    } else if (langs.length > 1) {
      const parts = [];
      for (const targetLang of langs) {
        if (targetLang === detected) continue;
        const result = await translateText(message.content, targetLang, detected);
        if (result.text && result.text !== message.content) {
          parts.push(`${getFlag(targetLang)}\n${result.text}`);
        }
      }
      if (parts.length > 0) {
        await message.reply({
          content: parts.join('\n\n'),
          allowedMentions: { repliedUser: false },
        });
      }
    }
  },
};
