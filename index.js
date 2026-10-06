console.log("🔥 AFK BOT KODU BASLADI!");
console.log("1 - Discord.js yükleniyor...");

const { Client, GatewayIntentBits, Events } = require('discord.js');
console.log("2 - Discord.js yüklendi...");
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
console.log("3 - Voice paketi yüklendi...");
const http = require('http');

// Render'ın servisi canlı tutması için HTTP sunucusu
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('AFK BOT aktif');
}).listen(process.env.PORT || 3000, '0.0.0.0');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

let reconnectTimer = null;

async function sesKanalinaGir() {
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

        if (!channel) {
            console.error('>>> SES KANALI BULUNAMADI!');
            return;
        }

        console.log(`>>> Hedef Kanal: ${channel.name}`);

        // Zaten bağlantı varsa tekrar oluşturmuyoruz
        const mevcutBaglanti = getVoiceConnection(guild.id);

        if (mevcutBaglanti) {
            console.log('>>> BOT ZATEN SES KANALINDA.');
            return;
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log('>>> SES KANALINA BAGLANTI BASARILI!');

        // Bağlantı düşerse tekrar bağlan
        connection.on('stateChange', (oldState, newState) => {
            console.log(
                `>>> SES BAGLANTI DURUMU: ${oldState.status} -> ${newState.status}`
            );
        });

        connection.on('error', (err) => {
            console.error('>>> SES BAGLANTI HATASI:', err.message);

            yenidenBaglan();
        });

    } catch (err) {
        console.error('>>> KANAL BAGLANTI HATASI:', err.message);
        yenidenBaglan();
    }
}

function yenidenBaglan() {
    if (reconnectTimer) return;

    console.log('>>> 10 saniye sonra tekrar bağlanılacak...');

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        await sesKanalinaGir();
    }, 10000);
}

client.once(Events.ClientReady, async (c) => {
    console.log(`>>> BOT CEVRIMICI OLDU: ${c.user.tag}`);

    await sesKanalinaGir();

    // Her 30 saniyede bir kontrol et
    setInterval(async () => {
        try {
            const connection = getVoiceConnection(process.env.GUILD_ID);

            if (!connection) {
                console.log('>>> SES BAGLANTISI YOK. TEKRAR BAGLANILIYOR...');
                await sesKanalinaGir();
            }
        } catch (err) {
            console.error('>>> KONTROL HATASI:', err.message);
        }
    }, 30000);
});

client.on('error', (err) => {
    console.error('>>> ISTEMCI HATASI:', err);
});

client.login(process.env.BOT_TOKEN)
    .then(() => {
        console.log('>>> TOKEN DOGRULANDI, GIRIS BASARILI!');
    })
    .catch(err => {
        console.error('>>> GIRIS HATASI:', err.message);
    });
