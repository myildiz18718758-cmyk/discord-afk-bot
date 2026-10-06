console.log("🔥 AFK BOT BAŞLIYOR...");
console.log("Discord.js sürümü:", require("discord.js").version);

const {
    Client,
    GatewayIntentBits,
    Events
} = require("discord.js");

const {
    joinVoiceChannel,
    getVoiceConnection
} = require("@discordjs/voice");

const http = require("http");

const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;


// ======================================
// HTTP SUNUCUSU
// ======================================

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("AFK BOT aktif");

});

server.listen(PORT, "0.0.0.0", () => {

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

client.on("debug", (info) => {

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
// DISCORD UYARI
// ======================================

client.on("warn", (info) => {

    console.warn(
        ">>> DISCORD UYARI:",
        info
    );

});


// ======================================
// DISCORD HATA
// ======================================

client.on("error", (err) => {

    console.error(
        ">>> DISCORD HATASI:",
        err
    );

});


// ======================================
// SHARD EVENTLERİ
// ======================================

client.on("shardReady", (id) => {

    console.log(
        "🟢 SHARD READY:",
        id
    );

});

client.on("shardError", (error, shardId) => {

    console.error(
        "❌ SHARD ERROR:",
        shardId,
        error
    );

});

client.on("shardDisconnect", (event, shardId) => {

    console.error(
        "🔴 SHARD DISCONNECT:",
        shardId,
        event
    );

});

client.on("shardReconnecting", (id) => {

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


        // SUNUCU

        const guild =
            await client.guilds.fetch(GUILD_ID);

        console.log(
            `>>> SUNUCU BULUNDU: ${guild.name}`
        );


        // SES KANALI

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


        // MEVCUT BAĞLANTI

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


        // SES DURUMU

        connection.on(
            "stateChange",
            (oldState, newState) => {

                console.log(
                    `>>> SES DURUMU: ${oldState.status} -> ${newState.status}`
                );

            }
        );


        // SES HATASI

        connection.on(
            "error",
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
// BOT READY
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
        // 30 SANİYEDE BİR KONTROL
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
// DISCORD GATEWAY API TESTİ
// ======================================

async function gatewayApiTesti() {

    console.log("");
    console.log("======================================");
    console.log(">>> DISCORD API TESTİ BAŞLIYOR...");
    console.log("======================================");


    if (!BOT_TOKEN) {

        console.error(
            "❌ BOT_TOKEN BULUNAMADI!"
        );

        return false;

    }


    const controller =
        new AbortController();


    const timeout =
        setTimeout(() => {

            controller.abort();

        }, 10000);


    try {

        console.log(
            ">>> Discord /gateway/bot endpointine bağlanılıyor..."
        );


        const response =
            await fetch(
                "https://discord.com/api/v10/gateway/bot",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bot ${BOT_TOKEN}`,

                        "User-Agent":
                            "DiscordAFKBot/1.0"
                    },

                    signal:
                        controller.signal
                }
            );


        console.log(
            ">>> GATEWAY API HTTP DURUMU:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            ">>> GATEWAY API CEVABI:",
            text
        );


        if (response.ok) {

            console.log(
                "🟢 DISCORD GATEWAY API TESTİ BAŞARILI!"
            );

            return true;

        } else {

            console.error(
                "❌ DISCORD GATEWAY API BAŞARISIZ!"
            );

            return false;

        }


    } catch (error) {

        if (error.name === "AbortError") {

            console.error(
                "❌ GATEWAY API TESTİ 10 SANİYEDE ZAMAN AŞIMINA UĞRADI!"
            );

        } else {

            console.error(
                "❌ GATEWAY API HATASI:",
                error
            );

        }

        return false;

    } finally {

        clearTimeout(timeout);

    }

}


// ======================================
// DISCORD LOGIN
// ======================================

async function discordBaslat() {

    console.log("");
    console.log("======================================");
    console.log(">>> DISCORD LOGIN BAŞLIYOR...");
    console.log("======================================");


    if (!BOT_TOKEN) {

        console.error(
            "❌ BOT_TOKEN BULUNAMADI!"
        );

        return;

    }


    console.log(
        ">>> BOT_TOKEN bulundu."
    );


    console.log(
        ">>> Discord'a bağlanılıyor..."
    );


    try {

        await client.login(BOT_TOKEN);

        console.log(
            "🟢 DISCORD LOGIN KOMUTU BAŞARILI!"
        );

    } catch (err) {

        console.error("");

        console.error(
            "❌ DISCORD LOGIN HATASI:"
        );

        console.error(err);

    }

}


// ======================================
// BAŞLAT
// ======================================

(async () => {

    const apiTestSonucu =
        await gatewayApiTesti();


    console.log("");


    if (apiTestSonucu) {

        console.log(
            "🟢 API TESTİ GEÇTİ."
        );

        console.log(
            ">>> Şimdi Discord.js login başlatılıyor..."
        );

    } else {

        console.log(
            "🔴 API TESTİ BAŞARISIZ."
        );

        console.log(
            ">>> Yine de Discord.js login deneniyor..."
        );

    }


    await discordBaslat();

})();
