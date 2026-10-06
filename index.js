const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

console.log("Sistem baslatildi, token kontrol ediliyor...");

client.on('ready', async () => {
    console.log(`>>> BOT GIRIS YAPTI: ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

        console.log(`Baglanilacak Oda: ${channel.name} (${guild.name})`);

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log(">>> ODAYA GIRIS BASARILI!");
    } catch (err) {
        console.error(">>> ODAYA GIRERKEN HATA:", err);
    }
});

client.login(process.env.BOT_TOKEN).catch(err => {
    console.error(">>> GIRIS HATASI (TOKEN GECERSIZ OLABILIR):", err.message);
});
