const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { guilds: {}, channels: {} };
  }
}

function save(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data));
}

async function turso(sql, args = []) {
  const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args } },
        { type: 'close' },
      ],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.results?.[0];
}

let tablesChecked = false;
async function ensureTables() {
  if (tablesChecked || !TURSO_URL) return;
  tablesChecked = true;
  await turso(
    `CREATE TABLE IF NOT EXISTS guild_settings (guild_id TEXT PRIMARY KEY, default_lang TEXT NOT NULL DEFAULT 'en')`
  );
  await turso(
    `CREATE TABLE IF NOT EXISTS channel_settings (channel_id TEXT PRIMARY KEY, guild_id TEXT NOT NULL, auto_translate_lang TEXT)`
  );
}

module.exports = {
  async getGuildSetting(guildId) {
    if (TURSO_URL) {
      await ensureTables();
      const res = await turso('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
      const row = res?.response?.result?.rows?.[0];
      if (row) return { guild_id: row[0], default_lang: row[1] };
      await turso('INSERT INTO guild_settings (guild_id) VALUES (?)', [guildId]);
      return { guild_id: guildId, default_lang: 'en' };
    }
    const data = load();
    if (!data.guilds[guildId]) {
      data.guilds[guildId] = { default_lang: 'en' };
      save(data);
    }
    return { guild_id: guildId, default_lang: data.guilds[guildId].default_lang };
  },
  async setGuildLang(guildId, lang) {
    if (TURSO_URL) {
      await ensureTables();
      await turso('INSERT OR REPLACE INTO guild_settings (guild_id, default_lang) VALUES (?, ?)', [guildId, lang]);
      return;
    }
    const data = load();
    if (!data.guilds[guildId]) data.guilds[guildId] = {};
    data.guilds[guildId].default_lang = lang;
    save(data);
  },
  async getChannelSetting(channelId) {
    if (TURSO_URL) {
      await ensureTables();
      const res = await turso('SELECT * FROM channel_settings WHERE channel_id = ?', [channelId]);
      const row = res?.response?.result?.rows?.[0];
      if (!row) return null;
      return { channel_id: row[0], guild_id: row[1], auto_translate_lang: row[2] || undefined };
    }
    const data = load();
    const ch = data.channels[channelId];
    return ch ? { channel_id: channelId, ...ch } : null;
  },
  async setChannelAutoTranslate(channelId, guildId, lang) {
    if (TURSO_URL) {
      await ensureTables();
      await turso(
        'INSERT OR REPLACE INTO channel_settings (channel_id, guild_id, auto_translate_lang) VALUES (?, ?, ?)',
        [channelId, guildId, lang]
      );
      return;
    }
    const data = load();
    if (!data.channels[channelId]) data.channels[channelId] = {};
    data.channels[channelId].guild_id = guildId;
    data.channels[channelId].auto_translate_lang = lang;
    save(data);
  },
  async disableChannelAutoTranslate(channelId) {
    if (TURSO_URL) {
      await ensureTables();
      await turso('DELETE FROM channel_settings WHERE channel_id = ?', [channelId]);
      return;
    }
    const data = load();
    if (data.channels[channelId]) {
      data.channels[channelId].auto_translate_lang = undefined;
      save(data);
    }
  },
  async setChannelTriad(channelId, guildId, langs) {
    const str = langs.join(',');
    if (TURSO_URL) {
      await ensureTables();
      await turso(
        'INSERT OR REPLACE INTO channel_settings (channel_id, guild_id, auto_translate_lang) VALUES (?, ?, ?)',
        [channelId, guildId, str]
      );
      return;
    }
    const data = load();
    if (!data.channels[channelId]) data.channels[channelId] = {};
    data.channels[channelId].guild_id = guildId;
    data.channels[channelId].auto_translate_lang = str;
    save(data);
  },

  close() {},
};
