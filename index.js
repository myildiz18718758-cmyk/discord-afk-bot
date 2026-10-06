const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

// Render web servisini açık tutmak için port dinleyici
const port = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot Aktif')).listen(port, () => {
    console.log(`Web sunucusu ${port} portunda aktif.`);
});

const token = (process.env.BOT_TOKEN || '').trim();
const guildId = (process.env.GUILD_ID || '').trim();
const channelId = (process.env.CHANNEL_ID || '').trim();

console.log("Değişken Kontrolü:");
console.log("- Token uzunluğu:", token.length);
console.log("- Guild ID:", guildId || "YOK!");
console.log("- Channel ID:", channelId || "YOK!");

if (!token) {
    console.error("HATA: BOT_TOKEN tanımlı değil veya boş!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', async () => {
    console.log(`>>> BOT GIRIS YAPTI: ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(guildId);
        console.log(`>>> Sunucu bulundu: ${guild.name}`);

        const channel = await guild.channels.fetch(channelId);
        console.log(`>>> Kanal bulundu: ${channel.name}`);

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log(">>> BOT SES KANALINA BAGLANDI!");
    } catch (err) {
        console.error(">>> KANAL BAGLANTI HATASI:", err.message);
    }
});

client.on('error', (err) => console.error(">>> DISCORD ISTEMCI HATASI:", err));

client.login(token).catch(err => {
    console.error(">>> LOGIN BASARISIZ:", err.message);
});
