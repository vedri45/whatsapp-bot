const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fetch = require("node-fetch");
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });
    const client = new Client({
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

    client.on('disconeccted', (reason) => {
        console.log('Client is disconnected!', reason);
        client.initialize();
    });

    client.on('remote_session_saved', () => {
        console.log('Remote session saved!');
    });

    const waitTime = 60 * 1000;
    let lastFetchTime = null;

    client.on('message', async (msg) => {
        if (msg.body === '!random' || msg.body === '!waifu' || msg.body === '!neko' || msg.body === '!megumin') {
            if (!lastFetchTime || Date.now() - lastFetchTime >= waitTime) {
                try {
                    let str = msg.body;
                    let body = str.replace('!', '');
                    const waifuResponse = await fetch(`https://api.waifu.pics/sfw/${body}`);
                    const waifuData = await waifuResponse.json();

                    const imageUrl = waifuData.url;
                    const media = await MessageMedia.fromUrl(imageUrl);

                    await client.sendMessage(msg.from, media);
                } catch (error) {
                    console.error('Error fetching image:', error);
                    client.sendMessage(msg.from, 'Oops! Something went wrong fetching your image.');
                } finally {
                    lastFetchTime = Date.now();
                }
            } else {
                const cooldownSeconds = waitTime / 1000;
                const remainingSeconds = Math.ceil(cooldownSeconds - (Date.now() - lastFetchTime) / 1000);

                client.sendMessage(msg.from, `Mohon tunggu ${remainingSeconds} detik`);
            }
        } else if (msg.body === '!everyone') {
            const chat = await msg.getChat();

            let text = '';
            let mentions = [];

            for (let participant of chat.participants) {
                mentions.push(`${participant.id.user}@c.us`);
                text += `@${participant.id.user} `;
            }

            await chat.sendMessage(text, { mentions });
        }
    });

    client.on('group_join', async (participant) => {
        const group = await client.getChatById(participant.groupId);
        const newMemberName = participant.name;

        // Craft your welcome message here
        const welcomeMessage = `Halo @${newMemberName}, selamat bergabung di grup! `;

        // Send the welcome message to the group
        group.sendMessage(welcomeMessage);
    });

    client.initialize();
});