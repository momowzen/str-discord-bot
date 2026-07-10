const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { guilds: {}, channels: {}, mirrors: [] };
  }
}

function save(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data));
}

module.exports = {
  getGuildSetting(guildId) {
    const data = load();
    if (!data.guilds[guildId]) {
      data.guilds[guildId] = { default_lang: 'en' };
      save(data);
    }
    return { guild_id: guildId, default_lang: data.guilds[guildId].default_lang };
  },
  setGuildLang(guildId, lang) {
    const data = load();
    if (!data.guilds[guildId]) data.guilds[guildId] = {};
    data.guilds[guildId].default_lang = lang;
    save(data);
  },
  getChannelSetting(channelId) {
    const data = load();
    const ch = data.channels[channelId];
    return ch ? { channel_id: channelId, ...ch } : null;
  },
  setChannelAutoTranslate(channelId, guildId, lang) {
    const data = load();
    if (!data.channels[channelId]) data.channels[channelId] = {};
    data.channels[channelId].guild_id = guildId;
    data.channels[channelId].auto_translate_lang = lang;
    save(data);
  },
  disableChannelAutoTranslate(channelId) {
    const data = load();
    if (data.channels[channelId]) {
      data.channels[channelId].auto_translate_lang = undefined;
      save(data);
    }
  },
  createMirrorLink(channelA, guildA, channelB, guildB) {
    const data = load();
    data.mirrors.push({ channel_a: channelA, guild_a: guildA, channel_b: channelB, guild_b: guildB, active: true });
    save(data);
  },
  getMirrorForChannel(channelId) {
    const data = load();
    const row = data.mirrors.find(m => m.active && (m.channel_a === channelId || m.channel_b === channelId));
    if (!row) return null;
    const targetChannel = row.channel_a === channelId ? row.channel_b : row.channel_a;
    const targetGuild = row.channel_a === channelId ? row.guild_b : row.guild_a;
    return { targetChannel, targetGuild, id: row.channel_a + row.channel_b };
  },
  removeMirrorLink(channelId) {
    const data = load();
    data.mirrors = data.mirrors.filter(m => m.channel_a !== channelId && m.channel_b !== channelId);
    save(data);
  },
  close() {},
};
