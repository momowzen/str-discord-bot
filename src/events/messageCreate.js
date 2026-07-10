const { translateText, detectLanguage } = require('../services/translator');
const { extractTextFromImage } = require('../services/ocr');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    console.log(`Message received from ${message.author.tag}: "${message.content}"`);
    if (message.author.bot) return;
    if (!message.guild) return;

    const channelSetting = client.db.getChannelSetting(message.channelId);
    const mirror = client.db.getMirrorForChannel(message.channelId);
    const guildSetting = client.db.getGuildSetting(message.guildId);

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
      const targetLang = channelSetting.auto_translate_lang;
      const detected = await detectLanguage(textToTranslate);
      if (detected && detected !== targetLang) {
        const result = await translateText(textToTranslate, targetLang, detected);
        if (result.text && result.text !== textToTranslate) {
          await message.reply({
            content: `*[auto-translated to ${targetLang}]*\n${result.text}`,
            allowedMentions: { repliedUser: false },
          });
        }
      }
    }

    // ── Mirror link forwarding ────────────────────────────────────
    if (mirror) {
      const targetChannel = await client.channels.fetch(mirror.targetChannel).catch(() => null);
      if (!targetChannel) return;

      const targetGuildSetting = client.db.getGuildSetting(mirror.targetGuild);
      const targetChannelSetting = client.db.getChannelSetting(mirror.targetChannel);
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
