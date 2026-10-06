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

const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;


// ==================================================
// HTTP SUNUCUSU
// ==================================================

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('AFK BOT aktif');

});

server.listen(PORT, '0.0.0.0', () => {

    console.log(
        `>>> HTTP SUNUCUSU BAŞLADI. Port: ${PORT}`
    );

});


// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]

});


// ==================================================
// DISCORD DEBUG
// ==================================================

client.on('debug', (info) => {

    console.log(
        ">>> DISCORD DEBUG:",
        info
    );

});

client.on('warn', (info) => {

    console.warn(
        ">>> DISCORD UYARI:",
        info
    );

});

client.on('error', (err) => {

    console.error(
        ">>> DISCORD HATASI:",
        err
    );

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


        const guild =
            await client.guilds.fetch(GUILD_ID);


        console.log(
            `>>> SUNUCU BULUNDU: ${guild.name}`
        );


        const channel =
            await guild.channels.fetch(CHANNEL_ID);


        if (!channel) {

            console.error(
                "❌ SES KANALI BULUNAMADI!"
            );

            return;

        }


        console.log(
            `>>> HEDEF KANAL: ${channel.name}`
        );


        // Zaten bağlıysa tekrar bağlanma

        const mevcutBaglanti =
            getVoiceConnection(GUILD_ID);


        if (mevcutBaglanti) {

            console.log(
                "🟢 BOT ZATEN SES KANALINDA."
            );

            return;

        }


        console.log(
            ">>> SES KANALINA GİRİLİYOR..."
        );


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
            "🟢 SES KANALINA BAĞLANTI GÖNDERİLDİ!"
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
// BOT DISCORD'A BAĞLANDI
// ==================================================

client.once(
    Events.ClientReady,
    async (c) => {

        console.log("");
        console.log("######################################");
        console.log("🟢🟢🟢 BOT ÇEVRİMİÇİ OLDU 🟢🟢🟢");
        console.log("######################################");


        console.log(
            `>>> BOT: ${c.user.tag}`
        );


        console.log(
            `>>> BOT ID: ${c.user.id}`
        );


        console.log(
            `>>> SUNUCU SAYISI: ${client.guilds.cache.size}`
        );


        // Ses kanalına gir

        await sesKanalinaGir();


        // Her 30 saniyede kontrol et

        setInterval(
            async () => {

                try {

                    const connection =
                        getVoiceConnection(GUILD_ID);


                    if (!connection) {

                        console.log(
                            "⚠️ SES BAĞLANTISI YOK!"
                        );

                        console.log(
                            ">>> TEKRAR BAĞLANILIYOR..."
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

            },
            30000
        );

    }
);


// ==================================================
// GİRİŞ
// ==================================================

console.log("");
console.log("======================================");
console.log(">>> DISCORD LOGIN BAŞLIYOR...");
console.log("======================================");


if (!BOT_TOKEN) {

    console.error(
        "❌ BOT_TOKEN BULUNAMADI!"
    );

} else {

    console.log(
        ">>> BOT_TOKEN bulundu."
    );

    console.log(
        ">>> Discord'a bağlanılıyor..."
    );


    client.login(BOT_TOKEN)

        .then(() => {

            console.log(
                "🟢 DISCORD LOGIN KOMUTU BAŞARILI!"
            );

        })

        .catch((err) => {

            console.error("");
            console.error(
                "❌ DISCORD LOGIN HATASI:"
            );

            console.error(err);

        });

}
