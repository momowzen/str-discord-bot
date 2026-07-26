const { REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    const commands = [];
    for (const cmd of client.commands.values()) {
      commands.push(cmd.data.toJSON());
    }

    try {
      const rest = new REST({ version: '10' }).setToken(client.config.token);
      await rest.put(Routes.applicationCommands(client.config.clientId), { body: commands });
      console.log(`Registered ${commands.length} slash commands globally`);
    } catch (err) {
      console.error('Failed to register commands:', err.message);
    }
  },
};
