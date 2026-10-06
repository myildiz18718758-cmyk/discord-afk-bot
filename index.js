console.log("🔥 AFK BOT BAŞLIYOR...");

const WebSocket = require("ws");
const http = require("http");

const {
    joinVoiceChannel,
    getVoiceConnection
} = require("@discordjs/voice");


// ======================================
// AYARLAR
// ======================================

const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;

const GATEWAY_URL =
    "wss://gateway.discord.gg/?v=10&encoding=json";


// Discord Gateway Intentleri
//
// Guilds          = 1
// GuildVoiceStates = 128
//
// Toplam = 129

const INTENTS = 1 | 128;


// ======================================
// DEĞİŞKENLER
// ======================================

let ws = null;

let heartbeatTimer = null;

let reconnectTimer = null;

let sequence = null;

let botUser = null;

let gatewayReady = false;

let voiceAdapterMethods = null;

let voiceConnection = null;


// ======================================
// HTTP SUNUCUSU
// ======================================

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("AFK BOT aktif");

});

server.listen(PORT, "0.0.0.0", () => {

    console.log(
        `>>> HTTP SUNUCUSU BAŞLADI. Port: ${PORT}`
    );

});


// ======================================
// LOG YARDIMCISI
// ======================================

function log(...args) {

    console.log(
        new Date().toISOString(),
        ...args
    );

}


// ======================================
// GATEWAY PAKETİ GÖNDER
// ======================================

function gatewaySend(op, data) {

    if (!ws) {

        console.error(
            "❌ Gateway WebSocket mevcut değil."
        );

        return false;

    }


    if (ws.readyState !== WebSocket.OPEN) {

        console.error(
            "❌ Gateway WebSocket açık değil."
        );

        return false;

    }


    const payload = {
        op: op,
        d: data
    };


    ws.send(
        JSON.stringify(payload)
    );


    return true;

}


// ======================================
// HEARTBEAT
// ======================================

function heartbeat() {

    if (!ws) {
        return;
    }


    if (ws.readyState !== WebSocket.OPEN) {
        return;
    }


    log(
        "💓 HEARTBEAT gönderiliyor. Sequence:",
        sequence
    );


    gatewaySend(
        1,
        sequence
    );

}


// ======================================
// HEARTBEAT BAŞLAT
// ======================================

function startHeartbeat(interval) {

    stopHeartbeat();


    // Discord'un önerdiği gibi
    // ilk heartbeat'i biraz rastgele geciktiriyoruz.

    const firstDelay =
        Math.floor(
            Math.random() * interval
        );


    log(
        `>>> HEARTBEAT INTERVAL: ${interval} ms`
    );

    log(
        `>>> İlk heartbeat yaklaşık ${firstDelay} ms sonra.`
    );


    setTimeout(() => {

        heartbeat();


        heartbeatTimer =
            setInterval(
                heartbeat,
                interval
            );

    }, firstDelay);

}


// ======================================
// HEARTBEAT DURDUR
// ======================================

function stopHeartbeat() {

    if (heartbeatTimer) {

        clearInterval(
            heartbeatTimer
        );

        heartbeatTimer = null;

    }

}


// ======================================
// SES ADAPTER'I
// ======================================

function createVoiceAdapter() {

    return (methods) => {

        log(
            "🟢 VOICE ADAPTER OLUŞTURULDU."
        );


        voiceAdapterMethods = methods;


        return {

            // @discordjs/voice
            // ana Discord Gateway'e paket gönderdiğinde
            // burası çalışır.

            sendPayload(payload) {

                if (!ws) {

                    console.error(
                        "❌ Voice payload gönderilemedi: WS yok."
                    );

                    return false;

                }


                if (
                    ws.readyState !==
                    WebSocket.OPEN
                ) {

                    console.error(
                        "❌ Voice payload gönderilemedi: WS kapalı."
                    );

                    return false;

                }


                try {

                    ws.send(
                        JSON.stringify(payload)
                    );


                    log(
                        ">>> VOICE → GATEWAY:",
                        payload.op
                    );


                    return true;

                } catch (error) {

                    console.error(
                        "❌ Voice payload gönderme hatası:",
                        error
                    );


                    return false;

                }

            },


            destroy() {

                log(
                    "🔴 VOICE ADAPTER DESTROY EDİLDİ."
                );


                voiceAdapterMethods = null;

            }

        };

    };

}


// ======================================
// SES KANALINA GİR
// ======================================

function sesKanalinaGir() {

    try {

        log("");
        log(
            "======================================"
        );
        log(
            ">>> SES KANALINA BAĞLANILIYOR"
        );
        log(
            "======================================"
        );


        if (!gatewayReady) {

            console.log(
                "⚠️ Gateway henüz READY değil."
            );

            return;

        }


        if (!GUILD_ID) {

            console.error(
                "❌ GUILD_ID bulunamadı!"
            );

            return;

        }


        if (!CHANNEL_ID) {

            console.error(
                "❌ CHANNEL_ID bulunamadı!"
            );

            return;

        }


        // Zaten bağlantı var mı?

        const mevcut =
            getVoiceConnection(
                GUILD_ID
            );


        if (mevcut) {

            log(
                "🟢 BOT ZATEN SES BAĞLANTISINDA."
            );

            voiceConnection = mevcut;

            return;

        }


        log(
            `>>> SUNUCU ID: ${GUILD_ID}`
        );

        log(
            `>>> KANAL ID: ${CHANNEL_ID}`
        );


        log(
            ">>> Genel kanalına giriş gönderiliyor..."
        );


        voiceConnection =
            joinVoiceChannel({

                channelId:
                    CHANNEL_ID,

                guildId:
                    GUILD_ID,

                adapterCreator:
                    createVoiceAdapter(),

                selfMute: true,

                selfDeaf: true,

                // Şimdilik DAVE'i kapalı tutuyoruz.
                // Bot yalnızca kanalda bekleyecek.

                daveEncryption: false,

                debug: true

            });


        log(
            "🟢 SES KANALINA GİRİŞ İSTEĞİ GÖNDERİLDİ!"
        );


        voiceConnection.on(
            "stateChange",
            (oldState, newState) => {

                log(
                    `>>> SES DURUMU: ${oldState.status} -> ${newState.status}`
                );

            }
        );


        voiceConnection.on(
            "error",
            (error) => {

                console.error(
                    "❌ VOICE CONNECTION HATASI:",
                    error
                );

            }
        );


    } catch (error) {

        console.error(
            "❌ SES KANALINA GİRİŞ HATASI:",
            error
        );

    }

}


// ======================================
// VOICE STATE UPDATE
// ======================================

function handleVoiceStateUpdate(data) {

    if (!data) {
        return;
    }


    if (data.guild_id !== GUILD_ID) {
        return;
    }


    // Sadece bizim botumuzun voice state'i

    if (
        botUser &&
        data.user_id !== botUser.id
    ) {

        return;

    }


    log(
        "🟣 VOICE_STATE_UPDATE alındı."
    );


    log(
        ">>> Kanal:",
        data.channel_id
    );


    log(
        ">>> Session ID:",
        data.session_id
            ? "VAR"
            : "YOK"
    );


    if (voiceAdapterMethods) {

        voiceAdapterMethods.onVoiceStateUpdate(
            data
        );

    }

}


// ======================================
// VOICE SERVER UPDATE
// ======================================

function handleVoiceServerUpdate(data) {

    if (!data) {
        return;
    }


    if (data.guild_id !== GUILD_ID) {
        return;
    }


    log(
        "🟣 VOICE_SERVER_UPDATE alındı."
    );


    log(
        ">>> Voice endpoint:",
        data.endpoint
    );


    log(
        ">>> Voice token:",
        data.token
            ? "VAR"
            : "YOK"
    );


    if (voiceAdapterMethods) {

        voiceAdapterMethods.onVoiceServerUpdate(
            data
        );

    }

}


// ======================================
// GATEWAY READY
// ======================================

function handleReady(data) {

    gatewayReady = true;


    botUser =
        data.user;


    log("");
    log(
        "######################################"
    );

    log(
        "🟢🟢🟢 DISCORD GATEWAY READY 🟢🟢🟢"
    );

    log(
        "######################################"
    );


    log(
        `>>> BOT ADI: ${botUser.username}`
    );


    log(
        `>>> BOT ID: ${botUser.id}`
    );


    log(
        `>>> GUILD SAYISI: ${data.guilds?.length || 0}`
    );


    log(
        "🟢 Render → Discord Gateway bağlantısı başarılı!"
    );


    // READY olduktan sonra ses kanalına gir.

    setTimeout(() => {

        sesKanalinaGir();

    }, 1500);

}


// ======================================
// GATEWAY MESAJLARI
// ======================================

function handleGatewayMessage(rawMessage) {

    let packet;


    try {

        packet =
            JSON.parse(
                rawMessage.toString()
            );

    } catch (error) {

        console.error(
            "❌ Gateway JSON parse hatası:",
            error
        );

        return;

    }


    const op =
        packet.op;

    const event =
        packet.t;


    if (packet.s !== null &&
        packet.s !== undefined) {

        sequence =
            packet.s;

    }


    log(
        `>>> DISCORD PAKETİ | OP: ${op} | EVENT: ${event || "YOK"}`
    );


    // ==================================
    // HELLO
    // ==================================

    if (op === 10) {

        log(
            "🟢 DISCORD HELLO GELDİ!"
        );


        const interval =
            packet.d.heartbeat_interval;


        startHeartbeat(
            interval
        );


        log(
            ">>> IDENTIFY gönderiliyor..."
        );


        gatewaySend(
            2,
            {

                token:
                    BOT_TOKEN,

                intents:
                    INTENTS,

                properties: {

                    os:
                        "linux",

                    browser:
                        "afk-bot",

                    device:
                        "afk-bot"

                }

            }
        );


        return;

    }


    // ==================================
    // DISPATCH
    // ==================================

    if (op === 0) {

        // READY

        if (event === "READY") {

            handleReady(
                packet.d
            );

            return;

        }


        // VOICE STATE UPDATE

        if (
            event ===
            "VOICE_STATE_UPDATE"
        ) {

            handleVoiceStateUpdate(
                packet.d
            );

            return;

        }


        // VOICE SERVER UPDATE

        if (
            event ===
            "VOICE_SERVER_UPDATE"
        ) {

            handleVoiceServerUpdate(
                packet.d
            );

            return;

        }


        return;

    }


    // ==================================
    // RECONNECT
    // ==================================

    if (op === 7) {

        log(
            "🔄 Discord yeniden bağlanmamızı istedi."
        );


        reconnect();

        return;

    }


    // ==================================
    // INVALID SESSION
    // ==================================

    if (op === 9) {

        console.error(
            "❌ DISCORD INVALID SESSION!"
        );


        setTimeout(() => {

            reconnect();

        }, 5000);


        return;

    }


    // ==================================
    // HEARTBEAT ACK
    // ==================================

    if (op === 11) {

        log(
            "💚 HEARTBEAT ACK alındı."
        );

        return;

    }

}


// ======================================
// WEBSOCKET BAĞLAN
// ======================================

function connectGateway() {

    if (!BOT_TOKEN) {

        console.error(
            "❌ BOT_TOKEN BULUNAMADI!"
        );

        return;

    }


    log("");
    log(
        "======================================"
    );

    log(
        ">>> DISCORD GATEWAY BAĞLANTISI BAŞLIYOR..."
    );

    log(
        "======================================"
    );


    gatewayReady = false;


    log(
        ">>> Gateway adresi:"
    );

    log(
        ">>> gateway.discord.gg"
    );


    ws =
        new WebSocket(
            GATEWAY_URL
        );


    ws.on(
        "open",
        () => {

            log(
                "🟢 WEBSOCKET BAĞLANTISI AÇILDI!"
            );


            log(
                ">>> Render → Discord Gateway bağlantısı başarılı."
            );

        }
    );


    ws.on(
        "message",
        (data) => {

            handleGatewayMessage(
                data
            );

        }
    );


    ws.on(
        "error",
        (error) => {

            console.error(
                "❌ GATEWAY WEBSOCKET HATASI:",
                error
            );

        }
    );


    ws.on(
        "close",
        (code, reason) => {

            log(
                `🔴 GATEWAY BAĞLANTISI KAPANDI. Kod: ${code}`
            );


            if (reason) {

                log(
                    ">>> Sebep:",
                    reason.toString()
                );

            }


            gatewayReady = false;


            stopHeartbeat();


            // Mevcut voice bağlantısını temizle.

            if (voiceConnection) {

                try {

                    voiceConnection.destroy();

                } catch (error) {

                    console.error(
                        "Voice destroy hatası:",
                        error
                    );

                }

                voiceConnection = null;

            }


            voiceAdapterMethods =
                null;


            scheduleReconnect();

        }
    );

}


// ======================================
// YENİDEN BAĞLANMA
// ======================================

function scheduleReconnect() {

    if (reconnectTimer) {
        return;
    }


    log(
        ">>> 5 saniye sonra Gateway'e yeniden bağlanılacak..."
    );


    reconnectTimer =
        setTimeout(() => {

            reconnectTimer = null;

            connectGateway();

        }, 5000);

}


// ======================================
// RECONNECT
// ======================================

function reconnect() {

    log(
        "🔄 RECONNECT başlatılıyor..."
    );


    if (ws) {

        try {

            ws.close();

        } catch (error) {

            console.error(
                "WS kapatma hatası:",
                error
            );

        }

    }


    scheduleReconnect();

}


// ======================================
// 30 SANİYEDE BİR SES KONTROLÜ
// ======================================

setInterval(() => {

    try {

        if (!gatewayReady) {

            log(
                "⚠️ Gateway hazır değil."
            );

            return;

        }


        const connection =
            getVoiceConnection(
                GUILD_ID
            );


        if (!connection) {

            log(
                "⚠️ SES BAĞLANTISI YOK!"
            );


            log(
                ">>> Tekrar ses kanalına giriliyor..."
            );


            sesKanalinaGir();


        } else {

            log(
                `🟢 SES BAĞLANTISI AKTİF. Durum: ${connection.state.status}`
            );

        }

    } catch (error) {

        console.error(
            "❌ SES KONTROL HATASI:",
            error
        );

    }

}, 30000);


// ======================================
// BAŞLAT
// ======================================

if (!BOT_TOKEN) {

    console.error(
        "❌ BOT_TOKEN ENVIRONMENT VARIABLE BULUNAMADI!"
    );

} else if (!GUILD_ID) {

    console.error(
        "❌ GUILD_ID ENVIRONMENT VARIABLE BULUNAMADI!"
    );

} else if (!CHANNEL_ID) {

    console.error(
        "❌ CHANNEL_ID ENVIRONMENT VARIABLE BULUNAMADI!"
    );

} else {

    log(
        ">>> BOT_TOKEN bulundu."
    );

    log(
        ">>> GUILD_ID bulundu."
    );

    log(
        ">>> CHANNEL_ID bulundu."
    );


    log(
        ">>> Discord'a doğrudan WebSocket ile bağlanılacak."
    );


    connectGateway();

}
