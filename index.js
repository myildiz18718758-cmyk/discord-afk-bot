console.log("🔥 AFK BOT BAŞLIYOR...");

const { Client, GatewayIntentBits, Events } = require('discord.js');
const {
    joinVoiceChannel,
    getVoiceConnection
} = require('@discordjs/voice');

const http = require('http');

console.log(">>> Discord.js yüklendi.");
console.log(">>> Voice paketi yüklendi.");

// ==================================================
// RENDER WEB SUNUCUSU
// ==================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('AFK BOT aktif');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> HTTP sunucusu başladı. Port: ${PORT}`);
});

// ==================================================
// DISCORD BOT
// ==================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

let reconnectTimer = null;

// ==================================================
// SES KANALINA BAĞLAN
// ==================================================

async function sesKanalinaGir() {
    try {
        console.log(">>> Ses kanalına bağlanma işlemi başladı.");

        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        if (!guild) {
            console.error(">>> SUNUCU BULUNAMADI!");
            return;
        }

        console.log(`>>> Sunucu bulundu: ${guild.name}`);

        const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

        if (!channel) {
            console.error(">>> SES KANALI BULUNAMADI!");
            return;
        }

        console.log(`>>> Hedef kanal: ${channel.name}`);

        // Zaten bağlantı varsa tekrar bağlanma
        const mevcutBaglanti = getVoiceConnection(guild.id);

        if (mevcutBaglanti) {
            console.log(">>> BOT ZATEN SES KANALINDA.");
            return;
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,

            // Botun mikrofonu kapalı
            selfMute: true,

            // Bot sesi dinlemesin
            selfDeaf: true
        });

        console.log(">>> SES KANALINA BAĞLANTI BAŞARILI!");

        // Ses bağlantısının durumunu takip et
        connection.on('stateChange', (oldState, newState) => {
            console.log(
                `>>> SES DURUMU: ${oldState.status} -> ${newState.status}`
            );
        });

        // Bağlantı hatası
        connection.on('error', (err) => {
            console.error(
                ">>> SES BAĞLANTI HATASI:",
                err.message
            );

            yenidenBaglan();
        });

    } catch (err) {

        console.error(
            ">>> SES KANALINA GİRİŞ HATASI:",
            err.message
        );

        yenidenBaglan();
    }
}

// ==================================================
// TEKRAR BAĞLAN
// ==================================================

function yenidenBaglan() {

    if (reconnectTimer) {
        return;
    }

    console.log(
        ">>> 10 saniye sonra tekrar bağlanmayı deneyeceğim..."
    );

    reconnectTimer = setTimeout(async () => {

        reconnectTimer = null;

        await sesKanalinaGir();

    }, 10000);
}

// ==================================================
// BOT DISCORD'A BAĞLANDI
// ==================================================

client.once(Events.ClientReady, async (c) => {

    console.log("");
    console.log("======================================");
    console.log(`>>> BOT ÇEVRİMİÇİ OLDU: ${c.user.tag}`);
    console.log("======================================");
    console.log("");

    await sesKanalinaGir();

    // Her 30 saniyede bir ses bağlantısını kontrol et
    setInterval(async () => {

        try {

            const connection = getVoiceConnection(
                process.env.GUILD_ID
            );

            if (!connection) {

                console.log(
                    ">>> SES BAĞLANTISI YOK!"
                );

                console.log(
                    ">>> TEKRAR BAĞLANILIYOR..."
                );

                await sesKanalinaGir();
            }

        } catch (err) {

            console.error(
                ">>> SES KONTROL HATASI:",
                err.message
            );
        }

    }, 30000);
});

// ==================================================
// DISCORD HATALARI
// ==================================================

client.on('error', (err) => {

    console.error(
        ">>> DISCORD İSTEMCİ HATASI:",
        err.message
    );

});

// ==================================================
// DISCORD'A GİRİŞ
// ==================================================

console.log(">>> Discord'a bağlanma isteği gönderiliyor...");

console.log(">>> DISCORD LOGIN BAŞLIYOR...");

client.on('debug', (info) => {
    console.log(">>> DISCORD DEBUG:", info);
});

client.on('warn', (info) => {
    console.warn(">>> DISCORD UYARI:", info);
});

client.on('error', (err) => {
    console.error(">>> DISCORD HATA:", err);
});

client.login(process.env.BOT_TOKEN)
    .then((token) => {
        console.log(">>> DISCORD LOGIN BAŞARILI!");
    })
    .catch((err) => {
        console.error(">>> DISCORD LOGIN HATASI:", err);
    });
