const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'str.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    default_lang TEXT NOT NULL DEFAULT 'en'
  );
  CREATE TABLE IF NOT EXISTS channel_settings (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    auto_translate_lang TEXT
  );
  CREATE TABLE IF NOT EXISTS mirror_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_a TEXT NOT NULL,
    channel_b TEXT NOT NULL,
    guild_a TEXT NOT NULL,
    guild_b TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
`);

const stmts = {
  getGuild: db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?'),
  insertGuild: db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)'),
  setGuildLang: db.prepare('UPDATE guild_settings SET default_lang = ? WHERE guild_id = ?'),
  getChannel: db.prepare('SELECT * FROM channel_settings WHERE channel_id = ?'),
  upsertChannel: db.prepare(
    'INSERT INTO channel_settings (channel_id, guild_id, auto_translate_lang) VALUES (?, ?, ?) ON CONFLICT(channel_id) DO UPDATE SET auto_translate_lang = excluded.auto_translate_lang'
  ),
  clearChannelLang: db.prepare('UPDATE channel_settings SET auto_translate_lang = NULL WHERE channel_id = ?'),
  insertMirror: db.prepare('INSERT INTO mirror_links (channel_a, channel_b, guild_a, guild_b) VALUES (?, ?, ?, ?)'),
  getMirror: db.prepare('SELECT * FROM mirror_links WHERE (channel_a = ? OR channel_b = ?) AND active = 1'),
  removeMirror: db.prepare('DELETE FROM mirror_links WHERE channel_a = ? OR channel_b = ?'),
};

module.exports = {
  getGuildSetting(guildId) {
    let row = stmts.getGuild.get(guildId);
    if (!row) {
      stmts.insertGuild.run(guildId);
      row = stmts.getGuild.get(guildId);
    }
    return row;
  },
  setGuildLang(guildId, lang) {
    this.getGuildSetting(guildId);
    stmts.setGuildLang.run(lang, guildId);
  },
  getChannelSetting(channelId) {
    return stmts.getChannel.get(channelId) || null;
  },
  setChannelAutoTranslate(channelId, guildId, lang) {
    stmts.upsertChannel.run(channelId, guildId, lang);
  },
  disableChannelAutoTranslate(channelId) {
    stmts.clearChannelLang.run(channelId);
  },
  createMirrorLink(channelA, guildA, channelB, guildB) {
    stmts.insertMirror.run(channelA, guildA, channelB, guildB);
  },
  getMirrorForChannel(channelId) {
    const row = stmts.getMirror.get(channelId, channelId);
    if (!row) return null;
    const targetChannel = row.channel_a === channelId ? row.channel_b : row.channel_a;
    const targetGuild = row.channel_a === channelId ? row.guild_b : row.guild_a;
    return { targetChannel, targetGuild, id: row.id };
  },
  removeMirrorLink(channelId) {
    stmts.removeMirror.run(channelId, channelId);
  },
  close() {
    db.close();
  },
};
