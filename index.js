const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

// Bulut sunucusunun kapanmaması için basit web sunucusu
http.createServer((req, res) => res.end('Bot Aktif!')).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.on('ready', () => {
    console.log(`${client.user.tag} aktif, ses kanalına bağlanılıyor...`);
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.log('Sunucu bulunamadı!');

    joinVoiceChannel({
        channelId: process.env.CHANNEL_ID,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
    });
});

client.login(process.env.BOT_TOKEN);
