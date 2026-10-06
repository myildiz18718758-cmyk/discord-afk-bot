console.log("🔥 AFK BOT BAŞLIYOR...");
console.log("Discord.js sürümü:", require('discord.js').version);

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


// ======================================
// HTTP SUNUCUSU
// ======================================

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


// ======================================
// DISCORD CLIENT
// ======================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});


// ======================================
// DISCORD DEBUG
// ======================================

client.on('debug', (info) => {

    console.log(
        ">>> DISCORD DEBUG:",
        info
    );

    if (
        info.includes("Preparing to connect") ||
        info.includes("Identifying") ||
        info.includes("Connected") ||
        info.includes("READY")
    ) {

        console.log(
            ">>> DISCORD WS DURUMU:",
            client.ws.status
        );

    }

});


// ======================================
// DISCORD UYARILARI
// ======================================

client.on('warn', (info) => {

    console.warn(
        ">>> DISCORD UYARI:",
        info
    );

});


// ======================================
// DISCORD HATALARI
// ======================================

client.on('error', (err) => {

    console.error(
        ">>> DISCORD HATASI:",
        err
    );

});


// ======================================
// SHARD EVENTLERİ
// ======================================

client.on('shardReady', (id) => {

    console.log(
        "🟢 SHARD READY:",
        id
    );

});


client.on('shardError', (error, shardId) => {

    console.error(
        "❌ SHARD ERROR:",
        shardId,
        error
    );

});


client.on('shardDisconnect', (event, shardId) => {

    console.error(
        "🔴 SHARD DISCONNECT:",
        shardId,
        event
    );

});


client.on('shardReconnecting', (id) => {

    console.log(
        "🔄 SHARD RECONNECTING:",
        id
    );

});


// ======================================
// SES KANALINA GİR
// ======================================

async function sesKanalinaGir() {

    try {

        console.log("");
        console.log("======================================");
        console.log(">>> SES KANALINA BAĞLANILIYOR");
        console.log("======================================");


        // SUNUCUYU BUL

        const guild =
            await client.guilds.fetch(GUILD_ID);


        console.log(
            `>>> SUNUCU BULUNDU: ${guild.name}`
        );


        // SES KANALINI BUL

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


        // ZATEN BAĞLI MI?

        const mevcutBaglanti =
            getVoiceConnection(GUILD_ID);


        if (mevcutBaglanti) {

            console.log(
                "🟢 BOT ZATEN SES KANALINDA."
            );

            return;
        }


        // SES KANALINA GİR

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


        // SES BAĞLANTI DURUMU

        connection.on(
            'stateChange',
            (oldState, newState) => {

                console.log(
                    `>>> SES DURUMU: ${oldState.status} -> ${newState.status}`
                );

            }
        );


        // SES HATASI

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


// ======================================
// BOT HAZIR OLDUĞUNDA
// ======================================

client.once(
    Events.ClientReady,
    async (c) => {

        console.log("");

        console.log(
            "######################################"
        );

        console.log(
            "🟢🟢🟢 BOT ÇEVRİMİÇİ OLDU 🟢🟢🟢"
        );

        console.log(
            "######################################"
        );


        console.log(
            `>>> BOT: ${c.user.tag}`
        );


        console.log(
            `>>> BOT ID: ${c.user.id}`
        );


        console.log(
            `>>> SUNUCU SAYISI: ${client.guilds.cache.size}`
        );


        // SES KANALINA GİR

        await sesKanalinaGir();


        // ======================================
        // 30 SANİYEDE BİR SES BAĞLANTISINI KONTROL ET
        // ======================================

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


// ======================================
// DISCORD LOGIN
// ======================================

console.log("");

console.log(
    "======================================"
);

console.log(
    ">>> DISCORD LOGIN BAŞLIYOR..."
);

console.log(
    "======================================"
);


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
