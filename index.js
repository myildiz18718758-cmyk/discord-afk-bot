const { Client, GatewayIntentBits, Events } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

// Render port dinleyicisi
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

console.log("Discord'a bağlanma isteği gönderiliyor...");

client.once(Events.ClientReady, async (c) => {
    console.log(`>>> BOT CEVRIMICI OLDU: ${c.user.tag}`);

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

        console.log(`>>> Hedef Kanal: ${channel.name}`);

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log(">>> SES KANALINA BAGLANTI BASARILI!");
    } catch (err) {
        console.error(">>> KANAL BAGLANTI HATASI:", err);
    }
});

client.on('error', (err) => console.error(">>> ISTEMCI HATASI:", err));

client.login(process.env.BOT_TOKEN).then(() => {
    console.log(">>> Token doğrulandı, giriş başarılı!");
}).catch(err => {
    console.error(">>> GIRIS HATASI:", err.message);
});
