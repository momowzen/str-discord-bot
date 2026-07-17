const { PermissionFlagsBits } = require('discord.js');
const { languages, getLanguageName } = require('../utils/languages');

module.exports = {
  name: 'multitranslate',
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('You need **Manage Channels** permission to use this command.');
    }

    const sub = args[0];

    if (sub === 'off') {
      await client.db.disableChannelAutoTranslate(message.channelId);
      return message.reply('Multi-translate disabled for this channel.');
    }

    if (sub !== 'set') {
      return message.reply('Usage: `!multitranslate set <lang1> <lang2> [lang3] [lang4] [lang5]` or `!multitranslate off`');
    }

    const langCodes = args.slice(1);
    if (langCodes.length < 1) {
      return message.reply('You need at least 1 language. Usage: `!multitranslate set <lang1> <lang2> [lang3] [lang4] [lang5]`');
    }

    const langs = [];
    for (const code of langCodes) {
      if (!languages[code]) {
        return message.reply(`Unsupported language code: \`${code}\`.`);
      }
      langs.push(code);
    }

    await client.db.setChannelTriad(message.channelId, message.guildId, langs);
    const names = langs.map(l => `**${getLanguageName(l)}** (${l})`).join(', ');
    const msg = langs.length === 1
      ? `Auto-translate enabled! All messages will be translated to ${names}.`
      : `Multi-translate enabled! Messages will auto-translate between: ${names}`;
    await message.reply(msg);
  },
};
