const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help and available commands'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('str-discord-bot — Help')
      .setDescription('Multilingual translation bot for Discord')
      .addFields(
        {
          name: '`/multitranslate set <lang1> <lang2> [lang3…5]`',
          value: 'Enable auto-translate in this channel for up to 5 languages. Requires **Manage Channels** permission.',
        },
        {
          name: '`/multitranslate off`',
          value: 'Disable auto-translate for this channel.',
        },
        {
          name: '`/help`',
          value: 'Show this message.',
        },
      )
      .setFooter({ text: 'Language codes: e.g. en, ja, ko, zh-CN, es, fr, de…' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
