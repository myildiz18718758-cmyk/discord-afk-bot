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
// RENDER WEB SUNUCUSU
// ==================================================

console.log(`>>> HTTP sunucusu hazırlanıyor. Port: ${PORT}`);

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('AFK BOT aktif');
});

server.on('error', (err) => {
    console.error("❌ HTTP SUNUCU HATASI:", err);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> HTTP SUNUCUSU BAŞLADI. Port: ${PORT}`);
});

// ==================================================
// ENV KONTROLÜ
// ==================================================

console.log("");
console.log("======================================");
console.log(">>> AYAR KONTROLÜ");
console.log("======================================");

console.log(
    `BOT_TOKEN: ${BOT_TOKEN ? "VAR" : "YOK"}`
);

console.log(
    `GUILD_ID: ${GUILD_ID ? "VAR" : "YOK"}`
);

console.log(
    `CHANNEL_ID: ${CHANNEL_ID ? "VAR" : "YOK"}`
);

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN BULUNAMADI!");
}

if (!GUILD_ID) {
    console.error("❌ GUILD_ID BULUNAMADI!");
}

if (!CHANNEL_ID) {
    console.error("❌ CHANNEL_ID BULUNAMADI!");
}

// ==================================================
// DISCORD CLIENT
// ==================================================

console.log("");
console.log(">>> Discord.js hazırlanıyor...");

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
// GATEWAY HATALARI
// ==================================================

client.on('shardError', (error, shardId) => {

    console.error("");
    console.error("======================================");
    console.error("❌ SHARD HATASI");
    console.error("======================================");

    console.error("Shard:", shardId);
    console.error(error);

});

client.on('shardReady', (shardId) => {

    console.log("");
    console.log("======================================");
    console.log("🟢 SHARD HAZIR");
    console.log("======================================");

    console.log("Shard:", shardId);

});

client.on('shardReconnecting', (shardId) => {

    console.log("");
    console.log("🟠 SHARD TEKRAR BAĞLANIYOR...");
    console.log("Shard:", shardId);

});

client.on('shardDisconnect', (event, shardId) => {

    console.log("");
    console.log("======================================");
    console.log("🔴 SHARD DISCONNECT");
    console.log("======================================");

    console.log("Shard:", shardId);
    console.log("Kod:", event.code);
    console.log("Temiz mi?:", event.wasClean);

});

// ==================================================
// SES KANALINA GİR
// ==================================================

async function sesKanalinaGir() {

    try {

        console.log("");
        console.log("======================================");
        console.log(">>> SES KANALINA BAĞLANILIYOR");
        console.log("======================================");

        const guild = await client.guilds.fetch(GUILD_ID);

        if (!guild) {
            console.error("❌ SUNUCU BULUNAMADI!");
            return;
        }

        console.log(
            `>>> SUNUCU: ${guild.name}`
        );

        const channel = await guild.channels.fetch(
            CHANNEL_ID
        );

        if (!channel) {
            console.error("❌ SES KANALI BULUNAMADI!");
            return;
        }

        console.log(
            `>>> KANAL: ${channel.name}`
        );

        const mevcutBaglanti =
            getVoiceConnection(GUILD_ID);

        if (mevcutBaglanti) {

            console.log(
                ">>> BOT ZATEN SES KANALINDA."
            );

            return;
        }

        console.log(
            ">>> SES KANALINA GİRİLİYOR..."
        );

        const connection = joinVoiceChannel({

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
                    `>>> SES DURUMU: ${oldState.status} -> ${newState.status}`
                );

            }
        );

        connection.on(
            'error',
            (err) => {

                console.error(
                    "❌ SES BAĞLANTI HATASI:",
                    err
                );

            }
        );

    } catch (err) {

        console.error("");
        console.error(
            "❌ SES KANALINA GİRİŞ HATASI:"
        );

        console.error(err);

    }

}

// ==================================================
// BOT HAZIR
// ==================================================

client.once(
    Events.ClientReady,
    async (c) => {

        console.log("");
        console.log("######################################");
        console.log("🟢🟢🟢 BOT ÇEVRİMİÇİ OLDU 🟢🟢🟢");
        console.log("######################################");

        console.log(
            `>>> Bot: ${c.user.tag}`
        );

        console.log(
            `>>> Bot ID: ${c.user.id}`
        );

        console.log(
            `>>> Sunucu sayısı: ${client.guilds.cache.size}`
        );

        console.log("");

        await sesKanalinaGir();

        // Her 30 saniyede kontrol
        setInterval(async () => {

            try {

                const connection =
                    getVoiceConnection(GUILD_ID);

                if (!connection) {

                    console.log(
                        "⚠️ SES BAĞLANTISI YOK. TEKRAR DENENİYOR..."
                    );

                    await sesKanalinaGir();

                } else {

                    console.log(
                        "🟢 SES BAĞLANTISI AKTİF."
                    );

                }

            } catch (err) {

                console.error(
                    "❌ SES KONTROL HATASI:",
                    err
                );

            }

        }, 30000);

    }
);

// ==================================================
// LOGIN
// ==================================================

console.log("");
console.log("======================================");
console.log(">>> DISCORD LOGIN BAŞLIYOR");
console.log("======================================");
console.log("");

if (!BOT_TOKEN) {

    console.error(
        "❌ BOT_TOKEN YOK. LOGIN YAPILMADI."
    );

} else {

    console.log(
        ">>> Token bulundu."
    );

    console.log(
        ">>> Discord Gateway bağlantısı başlatılıyor..."
    );

    // 20 saniyelik teşhis zamanlayıcısı
    const loginTimer = setTimeout(() => {

        console.error("");
        console.error("======================================");
        console.error("⏰ 20 SANİYE GEÇTİ!");
        console.error("======================================");

        console.error(
            "Discord Gateway bağlantısı hâlâ tamamlanmadı."
        );

        console.error(
            "BOT ÇEVRİMİÇİ OLDU mesajı gelmedi."
        );

        console.error(
            "Gateway bağlantısı beklemede/takılı durumda."
        );

    }, 20000);

    client.login(BOT_TOKEN)
        .then((token) => {

            clearTimeout(loginTimer);

            console.log("");
            console.log("======================================");
            console.log("🟢 DISCORD LOGIN BAŞARILI");
            console.log("======================================");

            console.log(
                ">>> Discord token kabul edildi."
            );

            console.log(
                ">>> Gateway bağlantısı kuruluyor..."
            );

        })
        .catch((err) => {

            clearTimeout(loginTimer);

            console.error("");
            console.error("======================================");
            console.error("❌❌❌ DISCORD LOGIN HATASI ❌❌❌");
            console.error("======================================");

            console.error(err);

        });

}
