const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mirror')
    .setDescription('Set up cross-channel translation mirroring')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub => sub
      .setName('pair')
      .setDescription('Link this channel with another channel for mirrored translation')
      .addChannelOption(opt => opt
        .setName('target')
        .setDescription('The channel to mirror with')
        .setRequired(true)))
    .addSubcommand(sub => sub
      .setName('unlink')
      .setDescription('Remove mirror link from this channel')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'unlink') {
      const mirror = await interaction.client.db.getMirrorForChannel(interaction.channelId);
      if (!mirror) {
        return interaction.reply({ content: 'This channel is not linked to any mirror.', ephemeral: true });
      }
      await interaction.client.db.removeMirrorLink(interaction.channelId);
      return interaction.reply({ content: 'Mirror link removed from this channel.', ephemeral: true });
    }

    const target = interaction.options.getChannel('target');
    if (!target?.isTextBased()) {
      return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
    }
    if (target.id === interaction.channelId) {
      return interaction.reply({ content: 'Cannot mirror a channel to itself.', ephemeral: true });
    }

    const existingA = await interaction.client.db.getMirrorForChannel(interaction.channelId);
    const existingB = await interaction.client.db.getMirrorForChannel(target.id);
    if (existingA || existingB) {
      return interaction.reply({ content: 'One or both channels are already mirrored. Unlink first.', ephemeral: true });
    }

    await interaction.client.db.createMirrorLink(
      interaction.channelId, interaction.guildId,
      target.id, target.guildId
    );
    await interaction.reply({ content: `Mirror link created between ${interaction.channel} ↔ ${target}. Messages will be auto-translated between channels.`, ephemeral: true });
  },
};
