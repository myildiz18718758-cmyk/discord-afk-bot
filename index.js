console.log("🔥 AFK BOT BAŞLIYOR...");

const {
    Client,
    GatewayIntentBits,
    Events
} = require('discord.js');

const {
    joinVoiceChannel,
    getVoiceConnection
} = require('@discordjs/voice');

const http = require('http');

// ==================================================
// AYARLAR
// ==================================================

const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

// ==================================================
// HTTP SUNUCUSU
// ==================================================

console.log(`>>> HTTP sunucusu hazırlanıyor. Port: ${PORT}`);

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('AFK BOT aktif');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> HTTP SUNUCUSU BAŞLADI. Port: ${PORT}`);
});

// ==================================================
// ENV KONTROL
// ==================================================

console.log("");
console.log("======================================");
console.log(">>> AYAR KONTROLÜ");
console.log("======================================");

console.log(
    "BOT_TOKEN:",
    BOT_TOKEN ? "VAR" : "YOK"
);

console.log(
    "GUILD_ID:",
    GUILD_ID ? "VAR" : "YOK"
);

console.log(
    "CHANNEL_ID:",
    CHANNEL_ID ? "VAR" : "YOK"
);

// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

console.log(">>> Discord.js hazır.");

// ==================================================
// DISCORD DEBUG
// ==================================================

client.on('debug', (info) => {
    console.log("🔵 DISCORD DEBUG:", info);
});

client.on('warn', (info) => {
    console.warn("🟡 DISCORD UYARI:", info);
});

client.on('error', (err) => {
    console.error("🔴 DISCORD CLIENT HATASI:", err);
});

// ==================================================
// SHARD DEBUG
// ==================================================

client.on('shardReady', (shardId) => {

    console.log("");
    console.log("🟢 SHARD HAZIR:", shardId);

});

client.on('shardError', (error, shardId) => {

    console.error("");
    console.error("❌ SHARD HATASI");
    console.error("Shard:", shardId);
    console.error(error);

});

client.on('shardDisconnect', (event, shardId) => {

    console.error("");
    console.error("🔴 SHARD DISCONNECT");
    console.error("Shard:", shardId);
    console.error("Kod:", event.code);
    console.error("Temiz:", event.wasClean);

});

client.on('shardReconnecting', (shardId) => {

    console.log(
        "🟠 SHARD TEKRAR BAĞLANIYOR:",
        shardId
    );

});

// ==================================================
// DISCORD API TESTİ
// ==================================================

async function discordApiTest() {

    console.log("");
    console.log("======================================");
    console.log(">>> DISCORD API TESTİ BAŞLIYOR");
    console.log("======================================");

    if (!BOT_TOKEN) {

        console.error(
            "❌ BOT_TOKEN YOK!"
        );

        return false;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 10000);

    try {

        console.log(
            ">>> Discord API'ye istek gönderiliyor..."
        );

        const response = await fetch(
            "https://discord.com/api/v10/users/@me",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bot ${BOT_TOKEN}`,
                    "User-Agent":
                        "DiscordAFKBot/1.0"
                },

                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        console.log(
            ">>> Discord API HTTP kodu:",
            response.status
        );

        const text = await response.text();

        if (response.ok) {

            try {

                const data = JSON.parse(text);

                console.log("");
                console.log("======================================");
                console.log("🟢 DISCORD API BAŞARILI!");
                console.log("======================================");

                console.log(
                    ">>> Bot adı:",
                    data.username
                );

                console.log(
                    ">>> Bot ID:",
                    data.id
                );

                return true;

            } catch {

                console.log(
                    ">>> API cevap verdi fakat JSON okunamadı."
                );

                return true;
            }

        } else {

            console.error("");
            console.error("======================================");
            console.error("❌ DISCORD API HATASI");
            console.error("======================================");

            console.error(
                "HTTP:",
                response.status
            );

            console.error(
                "Cevap:",
                text
            );

            return false;
        }

    } catch (err) {

        clearTimeout(timeout);

        console.error("");
        console.error("======================================");
        console.error("❌ DISCORD API BAĞLANTI HATASI");
        console.error("======================================");

        console.error(
            err.name,
            err.message
        );

        return false;
    }
}

// ==================================================
// SES KANALINA GİR
// ==================================================

async function sesKanalinaGir() {

    try {

        console.log("");
        console.log("======================================");
        console.log(">>> SES KANALINA BAĞLANILIYOR");
        console.log("======================================");

        const guild =
            await client.guilds.fetch(GUILD_ID);

        console.log(
            ">>> SUNUCU:",
            guild.name
        );

        const channel =
            await guild.channels.fetch(CHANNEL_ID);

        console.log(
            ">>> KANAL:",
            channel.name
        );

        const existing =
            getVoiceConnection(GUILD_ID);

        if (existing) {

            console.log(
                ">>> BOT ZATEN SES KANALINDA."
            );

            return;
        }

        const connection =
            joinVoiceChannel({

                channelId: channel.id,

                guildId: guild.id,

                adapterCreator:
                    guild.voiceAdapterCreator,

                selfMute: true,

                selfDeaf: true
            });

        console.log(
            "🟢 SES KANALINA BAĞLANTI KOMUTU GÖNDERİLDİ."
        );

        connection.on(
            'stateChange',
            (oldState, newState) => {

                console.log(
                    `>>> SES: ${oldState.status} -> ${newState.status}`
                );

            }
        );

        connection.on(
            'error',
            (err) => {

                console.error(
                    "❌ SES HATASI:",
                    err
                );

            }
        );

    } catch (err) {

        console.error(
            "❌ SES KANALI HATASI:",
            err
        );

    }
}

// ==================================================
// BOT READY
// ==================================================

client.once(
    Events.ClientReady,
    async (c) => {

        console.log("");
        console.log("######################################");
        console.log("🟢🟢🟢 BOT ÇEVRİMİÇİ OLDU 🟢🟢🟢");
        console.log("######################################");

        console.log(
            ">>> Bot:",
            c.user.tag
        );

        console.log(
            ">>> Sunucu sayısı:",
            client.guilds.cache.size
        );

        await sesKanalinaGir();

        setInterval(async () => {

            const connection =
                getVoiceConnection(GUILD_ID);

            if (!connection) {

                console.log(
                    "⚠️ SES BAĞLANTISI YOK → TEKRAR BAĞLANILIYOR"
                );

                await sesKanalinaGir();

            } else {

                console.log(
                    "🟢 SES BAĞLANTISI AKTİF"
                );

            }

        }, 30000);
    }
);

// ==================================================
// BAŞLAT
// ==================================================

async function baslat() {

    console.log("");
    console.log("======================================");
    console.log(">>> BAŞLATMA TESTİ");
    console.log("======================================");

    // Önce REST API'yi test et
    const apiBasarili =
        await discordApiTest();

    if (!apiBasarili) {

        console.error("");
        console.error(
            "❌ API TESTİ BAŞARISIZ."
        );

        console.error(
            "❌ Gateway'e geçilmiyor."
        );

        return;
    }

    console.log("");
    console.log(
        "🟢 API TESTİ BAŞARILI."
    );

    console.log(
        ">>> Şimdi Discord Gateway'e bağlanılıyor..."
    );

    console.log("");

    try {

        await client.login(BOT_TOKEN);

        console.log("");
        console.log(
            "🟢 LOGIN KOMUTU TAMAMLANDI."
        );

    } catch (err) {

        console.error("");
        console.error(
            "❌ LOGIN HATASI:"
        );

        console.error(err);

    }
}

// ==================================================
// BAŞLAT
// ==================================================

baslat();
