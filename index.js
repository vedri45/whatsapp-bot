const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const { handleWaifuRequest, handleHSRImageRequest, handleEveryoneRequest, handleStickerRequest, handlePromptRequest } = require('./handler');
require('dotenv').config();

const Image = mongoose.model('Image', {
    id: Number,
    tag: String,
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });
    const client = new Client({
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            // executablePath: '/usr/bin/google-chrome-stable',
        },
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        webVersionCache: {
            type: "remote",
            remotePath:
                "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true }, console.log);
        console.log('Scan QR with WhatsApp on your phone');
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('disconnected', (reason) => {
        console.log('Client is disconnected!', reason);
        client.initialize();
    });

    client.on('remote_session_saved', () => {
        console.log('Remote session saved!');
    });

    client.on('message', async (msg) => {
        if (['!waifu', '!neko', '!shinobu', '!megumin'].includes(msg.body)) {
            await handleWaifuRequest(msg, client, msg.body.replace('!', ''));
        } else if (['!topaz', '!firefly', '!robin', '!sparkle', '!acheron'].includes(msg.body)) {
            await handleHSRImageRequest(msg, client, msg.body.replace('!', ''), Image, 'Honkai Star Rail');
        } else if (msg.body === '!everyone') {
            await handleEveryoneRequest(msg);
        } else if (msg.body === '!sticker') {
            await handleStickerRequest(msg, client);
        } else if (msg.body.startsWith('!prompt')) {
            await handlePromptRequest(msg);
        }
    });

    client.on('group_join', async (participant) => {
        if (participant.id.participant !== process.env.BOT_NUMBER) {
            const chat = await client.getChatById(participant.chatId);
            const group_name = chat.name;
            let user = await client.getContactById(participant.id.participant);

            const welcomeMessage = "Halo @" + user.id.user + ",\n" +
                "selamat bergabung di grup " + group_name + "!";

            chat.sendMessage(welcomeMessage, { mentions: [user] });
        }
    });

    client.initialize();
});