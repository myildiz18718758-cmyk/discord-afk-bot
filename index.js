console.log("🔥 AFK BOT BAŞLIYOR...");

const { Client, GatewayIntentBits, Events } = require('discord.js');

const {
    joinVoiceChannel,
    getVoiceConnection
} = require('@discordjs/voice');

const http = require('http');


// ==================================================
// RENDER WEB SUNUCUSU
// ==================================================

const PORT = process.env.PORT || 3000;

console.log(`>>> HTTP sunucusu hazırlanıyor. Port: ${PORT}`);

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('AFK BOT aktif');
});

server.on('error', (err) => {
    console.error(">>> HTTP SUNUCU HATASI:", err);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> HTTP SUNUCUSU BAŞLADI. Port: ${PORT}`);
});


// ==================================================
// DISCORD CLIENT
// ==================================================

console.log(">>> Discord.js yükleniyor...");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

console.log(">>> Discord.js yüklendi.");
console.log(">>> Voice paketi yüklendi.");


// ==================================================
// DEĞİŞKENLER
// ==================================================

let reconnectTimer = null;


// ==================================================
// SES KANALINA GİR
// ==================================================

async function sesKanalinaGir() {

    try {

        console.log("");
        console.log("======================================");
        console.log(">>> SES KANALINA BAĞLANMA BAŞLIYOR");
        console.log("======================================");

        // Sunucuyu bul
        const guild = await client.guilds.fetch(
            process.env.GUILD_ID
        );

        if (!guild) {

            console.error(
                ">>> SUNUCU BULUNAMADI!"
            );

            return;
        }

        console.log(
            `>>> SUNUCU BULUNDU: ${guild.name}`
        );


        // Kanalı bul
        const channel = await guild.channels.fetch(
            process.env.CHANNEL_ID
        );

        if (!channel) {

            console.error(
                ">>> SES KANALI BULUNAMADI!"
            );

            return;
        }

        console.log(
            `>>> HEDEF KANAL: ${channel.name}`
        );


        // Zaten ses kanalındaysa tekrar bağlanma
        const mevcutBaglanti =
            getVoiceConnection(guild.id);

        if (mevcutBaglanti) {

            console.log(
                ">>> BOT ZATEN SES KANALINDA."
            );

            return;
        }


        // Ses kanalına bağlan
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
            ">>> SES KANALINA BAĞLANTI BAŞARILI!"
        );


        // Ses bağlantısının durumunu takip et
        connection.on(
            'stateChange',
            (oldState, newState) => {

                console.log(
                    `>>> SES DURUMU: ${oldState.status} -> ${newState.status}`
                );

            }
        );


        // Ses bağlantısında hata
        connection.on(
            'error',
            (err) => {

                console.error(
                    ">>> SES BAĞLANTI HATASI:",
                    err.message
                );

                yenidenBaglan();

            }
        );

    } catch (err) {

        console.error(
            ">>> SES KANALINA GİRİŞ HATASI:",
            err
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
        ">>> 10 SANİYE SONRA TEKRAR BAĞLANILACAK..."
    );


    reconnectTimer = setTimeout(
        async () => {

            reconnectTimer = null;

            await sesKanalinaGir();

        },
        10000
    );
}


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
// BOT DISCORD'A BAĞLANDI
// ==================================================

client.once(
    Events.ClientReady,
    async (c) => {

        console.log("");
        console.log("======================================");
        console.log(
            `>>> BOT ÇEVRİMİÇİ OLDU: ${c.user.tag}`
        );
        console.log("======================================");
        console.log("");


        // Ses kanalına gir
        await sesKanalinaGir();


        // Her 30 saniyede bir kontrol et
        setInterval(
            async () => {

                try {

                    const connection =
                        getVoiceConnection(
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

                    } else {

                        console.log(
                            ">>> SES BAĞLANTISI AKTİF."
                        );

                    }

                } catch (err) {

                    console.error(
                        ">>> SES KONTROL HATASI:",
                        err.message
                    );

                }

            },
            30000
        );

    }
);


// ==================================================
// DISCORD'A GİRİŞ
// ==================================================

console.log("");
console.log("======================================");
console.log(">>> DISCORD LOGIN BAŞLIYOR...");
console.log("======================================");
console.log("");


if (!process.env.BOT_TOKEN) {

    console.error(
        "❌ BOT_TOKEN BULUNAMADI!"
    );

} else {

    console.log(
        ">>> BOT_TOKEN bulundu."
    );

}


if (!process.env.GUILD_ID) {

    console.error(
        "❌ GUILD_ID BULUNAMADI!"
    );

} else {

    console.log(
        ">>> GUILD_ID bulundu."
    );

}


if (!process.env.CHANNEL_ID) {

    console.error(
        "❌ CHANNEL_ID BULUNAMADI!"
    );

} else {

    console.log(
        ">>> CHANNEL_ID bulundu."
    );

}


console.log(
    ">>> Discord'a bağlanma isteği gönderiliyor..."
);


client.login(process.env.BOT_TOKEN)

    .then(() => {

        console.log("");
        console.log(
            "======================================"
        );

        console.log(
            ">>> DISCORD LOGIN BAŞARILI!"
        );

        console.log(
            "======================================"
        );

        console.log("");

    })

    .catch((err) => {

        console.error("");
        console.error(
            "======================================"
        );

        console.error(
            "❌ DISCORD LOGIN HATASI!"
        );

        console.error(
            "======================================"
        );

        console.error(
            err
        );

        console.error("");

    });
