const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { languages, getLanguageName } = require('../utils/languages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('multitranslate')
    .setDescription('Auto-translate between two or more languages bidirectionally')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set languages to auto-translate between (e.g., en ja ko)')
      .addStringOption(opt => opt
        .setName('lang1')
        .setDescription('First language code')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(opt => opt
        .setName('lang2')
        .setDescription('Second language code')
        .setRequired(true)
        .setAutocomplete(true))
      .addStringOption(opt => opt
        .setName('lang3')
        .setDescription('Third language code (optional)')
        .setAutocomplete(true))
      .addStringOption(opt => opt
        .setName('lang4')
        .setDescription('Fourth language code (optional)')
        .setAutocomplete(true))
      .addStringOption(opt => opt
        .setName('lang5')
        .setDescription('Fifth language code (optional)')
        .setAutocomplete(true)))
    .addSubcommand(sub => sub
      .setName('off')
      .setDescription('Disable multi-translate in this channel')),
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
      return interaction.reply('Multi-translate disabled for this channel.');
    }

    const langs = [];
    for (let i = 1; i <= 5; i++) {
      const code = interaction.options.getString(`lang${i}`);
      if (code) {
        if (!languages[code]) {
          return interaction.reply({ content: `Unsupported language code: \`${code}\`.`, ephemeral: true });
        }
        langs.push(code);
      }
    }

    if (langs.length < 2) {
      return interaction.reply({ content: 'You need at least 2 languages.', ephemeral: true });
    }

    await interaction.client.db.setChannelTriad(interaction.channelId, interaction.guildId, langs);
    const names = langs.map(l => `**${getLanguageName(l)}** (${l})`).join(', ');
    await interaction.reply(
      `Multi-translate enabled! Messages in any of these languages will be auto-translated to all others:\n${names}`
    );
  },
};
