const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;

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
  await turso(
    `CREATE TABLE IF NOT EXISTS mirror_links (channel_a TEXT NOT NULL, channel_b TEXT NOT NULL, guild_a TEXT NOT NULL, guild_b TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)`
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
  async createMirrorLink(channelA, guildA, channelB, guildB) {
    if (TURSO_URL) {
      await ensureTables();
      await turso(
        'INSERT INTO mirror_links (channel_a, channel_b, guild_a, guild_b) VALUES (?, ?, ?, ?)',
        [channelA, channelB, guildA, guildB]
      );
      return;
    }
    const data = load();
    data.mirrors.push({ channel_a: channelA, guild_a: guildA, channel_b: channelB, guild_b: guildB, active: true });
    save(data);
  },
  async getMirrorForChannel(channelId) {
    if (TURSO_URL) {
      await ensureTables();
      const res = await turso(
        'SELECT * FROM mirror_links WHERE (channel_a = ? OR channel_b = ?) AND active = 1',
        [channelId, channelId]
      );
      const row = res?.response?.result?.rows?.[0];
      if (!row) return null;
      const targetChannel = row[0] === channelId ? row[1] : row[0];
      const targetGuild = row[0] === channelId ? row[3] : row[2];
      return { targetChannel, targetGuild, id: row[0] + row[1] };
    }
    const data = load();
    const row = data.mirrors.find(m => m.active && (m.channel_a === channelId || m.channel_b === channelId));
    if (!row) return null;
    const targetChannel = row.channel_a === channelId ? row.channel_b : row.channel_a;
    const targetGuild = row.channel_a === channelId ? row.guild_b : row.guild_a;
    return { targetChannel, targetGuild, id: row.channel_a + row.channel_b };
  },
  async removeMirrorLink(channelId) {
    if (TURSO_URL) {
      await ensureTables();
      await turso('DELETE FROM mirror_links WHERE channel_a = ? OR channel_b = ?', [channelId, channelId]);
      return;
    }
    const data = load();
    data.mirrors = data.mirrors.filter(m => m.channel_a !== channelId && m.channel_b !== channelId);
    save(data);
  },
  close() {},
};
