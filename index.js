const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

// Render servisinin ayakta kalması için
http.createServer((req, res) => res.end('Bot Aktif!')).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.on('ready', async () => {
    console.log(`>>> BOT GIRIS YAPTI: ${client.user.tag}`);

    const guildId = process.env.GUILD_ID?.trim();
    const channelId = process.env.CHANNEL_ID?.trim();

    try {
        const guild = await client.guilds.fetch(guildId);
        console.log(`>>> SUNUCU BULUNDU: ${guild.name}`);

        const channel = await guild.channels.fetch(channelId);
        console.log(`>>> KANAL BULUNDU: ${channel.name}`);

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        console.log('>>> KANALA BAGLANTI ISTEGI GONDERILDI!');
    } catch (err) {
        console.error('>>> BAGLANTI HATASI:', err.message);
    }
});

client.on('error', (err) => console.error('Discord Hatası:', err));

client.login(process.env.BOT_TOKEN?.trim());
