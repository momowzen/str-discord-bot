const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const TRIAD_LANGS = ['en', 'ja', 'ko'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('triad')
    .setDescription('Enable 3-way auto-translate between English, Japanese, and Korean')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => sub
      .setName('on')
      .setDescription('Enable triad translation in this channel'))
    .addSubcommand(sub => sub
      .setName('off')
      .setDescription('Disable triad translation in this channel')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'off') {
      await interaction.client.db.disableChannelAutoTranslate(interaction.channelId);
      return interaction.reply('Triad translation disabled for this channel.');
    }
    await interaction.client.db.setChannelTriad(interaction.channelId, interaction.guildId, TRIAD_LANGS);
    await interaction.reply(
      'Triad translation enabled! Any message in **English**, **Japanese**, or **Korean** will be auto-translated to the other two languages.'
    );
  },
};
