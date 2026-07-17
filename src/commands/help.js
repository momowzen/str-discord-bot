module.exports = {
  name: 'help',
  async execute(message, args, client) {
    await message.reply(
      '**str-discord-bot — Commands**\n\n'
      + '`!multitranslate set <lang1> <lang2> [lang3…5]`\n'
      + '  Enable auto-translate in this channel (requires **Manage Channels**)\n\n'
      + '`!multitranslate off`\n'
      + '  Disable auto-translate for this channel\n\n'
      + '`!help`\n'
      + '  Show this message\n\n'
      + 'Language codes: e.g. en, ja, ko, zh-CN, es, fr, de…'
    );
  },
};
