const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;

// Render HTTP sunucusu
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('AFK BOT Gateway Test');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 HTTP sunucusu çalışıyor: ${PORT}`);
});

// Token kontrolü
if (!TOKEN) {
    console.error('❌ BOT_TOKEN bulunamadı!');
    process.exit(1);
}

console.log('');
console.log('======================================');
console.log('🔥 DISCORD GATEWAY TESTİ');
console.log('======================================');

const gatewayUrl =
    'wss://gateway.discord.gg/?v=10&encoding=json';

console.log('>>> Gateway adresi: gateway.discord.gg');
console.log('>>> WebSocket bağlantısı başlatılıyor...');

const ws = new WebSocket(gatewayUrl, {
    handshakeTimeout: 15000
});

let helloAlindi = false;
let readyAlindi = false;

ws.on('open', () => {

    console.log('');
    console.log('🟢🟢🟢 WEBSOCKET BAĞLANTISI AÇILDI! 🟢🟢🟢');
    console.log('>>> Render → Discord Gateway bağlantısı başarılı.');
});

ws.on('message', (data) => {

    try {

        const packet = JSON.parse(data.toString());

        console.log('');
        console.log(
            `>>> DISCORD PAKETİ | OP: ${packet.op} | EVENT: ${packet.t || 'YOK'}`
        );

        // Hello
        if (packet.op === 10) {

            helloAlindi = true;

            console.log('');
            console.log('🟢 DISCORD HELLO GELDİ!');
            console.log(
                '>>> Discord Gateway bağlantıyı kabul etti.'
            );

            const identify = {
                op: 2,

                d: {
                    token: TOKEN,

                    intents: 513,

                    properties: {
                        os: 'linux',
                        browser: 'afk-bot-test',
                        device: 'afk-bot-test'
                    }
                }
            };

            console.log(
                '>>> IDENTIFY gönderiliyor...'
            );

            ws.send(JSON.stringify(identify));
        }

        // Ready
        if (packet.op === 0 && packet.t === 'READY') {

            readyAlindi = true;

            console.log('');
            console.log('======================================');
            console.log('🟢🟢🟢 DISCORD READY GELDİ! 🟢🟢🟢');
            console.log('======================================');

            console.log(
                '>>> BOT DISCORD GATEWAYE BAŞARIYLA BAĞLANDI.'
            );

            console.log(
                '>>> Bot adı:',
                packet.d.user.username
            );

            console.log(
                '>>> Bot ID:',
                packet.d.user.id
            );

            console.log(
                '>>> Sunucu sayısı:',
                packet.d.guilds.length
            );

            console.log('');
            console.log(
                '🎉 GATEWAY TESTİ BAŞARILI!'
            );

            console.log(
                '>>> Şimdi AFK bot koduna geri dönebiliriz.'
            );
        }

        // Invalid Session
        if (packet.op === 9) {

            console.error('');
            console.error(
                '❌ DISCORD: INVALID SESSION'
            );

            console.error(
                '>>> Token veya Identify bilgileri reddedildi.'
            );
        }

    } catch (err) {

        console.error(
            '❌ Paket okunamadı:',
            err.message
        );

    }
});

ws.on('error', (err) => {

    console.error('');
    console.error('======================================');
    console.error('❌❌❌ WEBSOCKET HATASI ❌❌❌');
    console.error('======================================');

    console.error(
        'Hata:',
        err.message
    );

});

ws.on('close', (code, reason) => {

    console.error('');
    console.error('======================================');
    console.error('🔴 GATEWAY BAĞLANTISI KAPANDI');
    console.error('======================================');

    console.error(
        'Close kodu:',
        code
    );

    console.error(
        'Sebep:',
        reason.toString() || 'Belirtilmedi'
    );

});

setTimeout(() => {

    console.log('');
    console.log('======================================');
    console.log('>>> 30 SANİYELİK TEST SONUCU');
    console.log('======================================');

    console.log(
        'WebSocket açıldı:',
        ws.readyState === WebSocket.OPEN ? 'EVET' : 'HAYIR'
    );

    console.log(
        'Discord Hello geldi:',
        helloAlindi ? 'EVET' : 'HAYIR'
    );

    console.log(
        'Discord Ready geldi:',
        readyAlindi ? 'EVET' : 'HAYIR'
    );

}, 30000);
