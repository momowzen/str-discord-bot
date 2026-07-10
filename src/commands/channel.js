const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { languages, getLanguageName } = require('../utils/languages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Configure auto-translate for this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => sub
      .setName('translate')
      .setDescription('Auto-translate all messages in this channel to a language')
      .addStringOption(opt => opt
        .setName('language')
        .setDescription('Target language code (e.g., en, es, fr)')
        .setRequired(true)
        .setAutocomplete(true)))
    .addSubcommand(sub => sub
      .setName('off')
      .setDescription('Disable auto-translate in this channel')),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = Object.entries(languages)
      .filter(([code, name]) => code.includes(focused) || name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(([code, name]) => ({ name: `${name} (${code})`, value: code }));
    await interaction.respond(matches);
  },
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'off') {
      await interaction.client.db.disableChannelAutoTranslate(interaction.channelId);
      return interaction.reply('Auto-translate disabled for this channel.');
    }
    const lang = interaction.options.getString('language');
    if (!languages[lang]) {
      return interaction.reply({ content: `Unsupported language code: \`${lang}\`.`, ephemeral: true });
    }
    await interaction.client.db.setChannelAutoTranslate(interaction.channelId, interaction.guildId, lang);
    await interaction.reply(`Auto-translate enabled for this channel → **${getLanguageName(lang)}** (${lang}).`);
  },
};
