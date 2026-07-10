const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { languages, getLanguageName } = require('../utils/languages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Configure server-wide translation settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('language')
      .setDescription('Set the default server language')
      .addStringOption(opt => opt
        .setName('code')
        .setDescription('Language code (e.g., en, es, fr, ja)')
        .setRequired(true)
        .setAutocomplete(true))),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = Object.entries(languages)
      .filter(([code, name]) => code.includes(focused) || name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(([code, name]) => ({ name: `${name} (${code})`, value: code }));
    await interaction.respond(matches);
  },
  async execute(interaction) {
    const lang = interaction.options.getString('code');
    if (!languages[lang]) {
      return interaction.reply({ content: `Unsupported language code: \`${lang}\`.`, ephemeral: true });
    }
    await interaction.client.db.setGuildLang(interaction.guildId, lang);
    await interaction.reply(`Default language set to **${getLanguageName(lang)}** (${lang}).`);
  },
};
