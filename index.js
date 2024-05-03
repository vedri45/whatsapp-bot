const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fetch = require("node-fetch");
require('dotenv').config();

const Image = mongoose.model('Image', {
    id: Number,
    tag: String,
});

const Cosplay = mongoose.model('Cosplay', {
    url: String,
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
        const handleWaifuRequest = async (body) => {
            if (!lastFetchTime || Date.now() - lastFetchTime >= waitTime) {
                try {
                    const imageUrl = await fetch(`https://api.waifu.pics/sfw/${body}`)
                        .then(res => res.json())
                        .then(data => data.url);
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
        };

        const handleHSRImageRequest = async (body, collection, tag) => {
            const capitalizeStr = body.charAt(0).toUpperCase() + body.slice(1);
            const pipeline = [
                { $match: { tag: `${capitalizeStr} (${tag})` } },
                { $sample: { size: 1 } }
            ];
            const data = await collection.aggregate(pipeline);
            if (data.length > 0) {
                if (!lastFetchTime || Date.now() - lastFetchTime >= waitTime) {
                    try {
                        const imageUrl = await fetch(`https://www.zerochan.net/${data[0].id}?json`, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
                                'Cookie': `z_theme=${process.env.Z_THEME}; guest_id=${process.env.GUEST_ID}; z_id=${process.env.Z_ID}; z_hash=${process.env.Z_HASH};`
                            },
                        }).then(res => res.json());
                        const media = await MessageMedia.fromUrl(imageUrl.large);
                        await client.sendMessage(msg.from, media);
                    }
                    catch (error) {
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
            }
        };

        const handleCosplayRequest = async (body, collection, tag) => {
            const capitalizeStr = body.charAt(0).toUpperCase() + body.slice(1);
            const pipeline = [
                { $match: { tag: `${capitalizeStr} (${tag})` } },
                { $sample: { size: 1 } }
            ];
            const data = await collection.aggregate(pipeline);
            if (data.length > 0) {
                if (!lastFetchTime || Date.now() - lastFetchTime >= waitTime) {
                    const media = await MessageMedia.fromUrl(data[0].url);
                    await client.sendMessage(msg.from, media);
                    lastFetchTime = Date.now();
                } else {
                    const cooldownSeconds = waitTime / 1000;
                    const remainingSeconds = Math.ceil(cooldownSeconds - (Date.now() - lastFetchTime) / 1000);

                    client.sendMessage(msg.from, `Mohon tunggu ${remainingSeconds} detik`);
                }
            }
        };

        const handleEveryoneRequest = async () => {
            const chat = await msg.getChat();
            const groupId = chat.id.user;
            if (groupId === process.env.GROUP_ID) {
                let text = '';
                let mentions = [];

                for (let participant of chat.participants) {
                    mentions.push(`${participant.id.user}@c.us`);
                    text += `@${participant.id.user} `;
                }

                await chat.sendMessage(text, { mentions });
            }
        };

        const handleStickerRequest = async () => {
            if (msg.type === 'image' && msg.hasMedia === true) {
                const media = await msg.downloadMedia();
                await client.sendMessage(msg.from, media, {
                    sendMediaAsSticker: true,
                    stickerAuthor: 'Chatbot',
                    stickerName: 'Generated Sticker'
                });
            }
        };

        if (['!waifu', '!neko', '!shinobu', '!megumin'].includes(msg.body)) {
            await handleWaifuRequest(msg.body.replace('!', ''));
        } else if (['!topaz', '!firefly', '!robin', '!sparkle', '!acheron'].includes(msg.body)) {
            await handleHSRImageRequest(msg.body.replace('!', ''), Image, 'Honkai Star Rail');
        } else if (msg.body === '!azula') {
            await handleCosplayRequest(msg.body.replace('!', ''), Cosplay, 'Cosplay');
        } else if (msg.body === '!everyone') {
            await handleEveryoneRequest();
        } else if (msg.body === '!sticker') {
            await handleStickerRequest();
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