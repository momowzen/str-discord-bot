const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { languages, getLanguageName } = require('../utils/languages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('default')
    .setDescription('Set the base language for this channel — everything else translates to it')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(opt => opt
      .setName('language')
      .setDescription('Language code (e.g., en, es, fr, ja)')
      .setRequired(true)
      .setAutocomplete(true)),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = Object.entries(languages)
      .filter(([code, name]) => code.includes(focused) || name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(([code, name]) => ({ name: `${name} (${code})`, value: code }));
    await interaction.respond(matches);
  },
  async execute(interaction) {
    const lang = interaction.options.getString('language');
    if (!languages[lang]) {
      return interaction.reply({ content: `Unsupported language code: \`${lang}\`.`, ephemeral: true });
    }
    await interaction.client.db.setChannelAutoTranslate(interaction.channelId, interaction.guildId, lang);
    await interaction.reply({
      content: `Default language set to **${getLanguageName(lang)}** (${lang}). Any other language will be auto-translated to this.`,
      ephemeral: true,
    });
  },
};
