const { translateText, detectLanguage } = require('../services/translator');
const { extractTextFromImage } = require('../services/ocr');
const { getFlag } = require('../utils/languages');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    console.log(`Message received from ${message.author.tag}: "${message.content}"`);
    if (message.author.bot) return;
    if (!message.guild) return;

    const channelSetting = await client.db.getChannelSetting(message.channelId);
    const mirror = await client.db.getMirrorForChannel(message.channelId);
    const guildSetting = await client.db.getGuildSetting(message.guildId);
    // Gather text — message content + OCR from attached images
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

    // ── Auto-translate reply ──────────────────────────────────────
    if (channelSetting?.auto_translate_lang) {
      const langs = channelSetting.auto_translate_lang.includes(',')
        ? channelSetting.auto_translate_lang.split(',')
        : [channelSetting.auto_translate_lang];
      const detected = await detectLanguage(textToTranslate);
      if (detected && langs.length === 1 && detected !== langs[0]) {
        const result = await translateText(textToTranslate, langs[0], detected);
        if (result.text && result.text !== textToTranslate) {
          await message.reply({
            content: `${getFlag(langs[0])} ${result.text}`,
            allowedMentions: { repliedUser: false },
          });
        }
      } else if (detected && langs.length > 1) {
        const parts = [];
        for (const targetLang of langs) {
          if (targetLang === detected) continue;
          const result = await translateText(textToTranslate, targetLang, detected);
          if (result.text && result.text !== textToTranslate) {
            parts.push(`${getFlag(targetLang)} ${result.text}`);
          }
        }
        if (parts.length > 0) {
          await message.reply({
            content: parts.join('\n\n'),
            allowedMentions: { repliedUser: false },
          });
        }
      }
    }

    // ── Mirror link forwarding ────────────────────────────────────
    if (mirror) {
      const targetChannel = await client.channels.fetch(mirror.targetChannel).catch(() => null);
      if (!targetChannel) return;

      const targetGuildSetting = await client.db.getGuildSetting(mirror.targetGuild);
      const targetChannelSetting = await client.db.getChannelSetting(mirror.targetChannel);
      const targetLang = targetChannelSetting?.auto_translate_lang || targetGuildSetting.default_lang;

      const detected = await detectLanguage(textToTranslate);
      const result = await translateText(textToTranslate, targetLang, detected || 'auto');
      if (result.text && result.text !== textToTranslate) {
        const embed = {
          color: 0x5865F2,
          author: {
            name: message.member?.displayName || message.author.tag,
            icon_url: message.author.displayAvatarURL(),
          },
          description: result.text.substring(0, 4000),
          footer: { text: `↔ ${targetLang.toUpperCase()} • ${message.channel.name}` },
          timestamp: new Date().toISOString(),
        };
        if (message.attachments.size > 0) {
          embed.image = { url: message.attachments.first().url };
        }
        await targetChannel.send({ embeds: [embed] });
      }
    }
  },
};
