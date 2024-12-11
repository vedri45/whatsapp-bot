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
        // Check if the message mentions the bot and the length is 1
        if (msg.mentionedIds && msg.mentionedIds.length === 1 && msg.mentionedIds[0] === process.env.BOT_NUMBER) {
            // Trim the @c.us suffix from the bot number
            const botNumber = process.env.BOT_NUMBER.replace(/@c\.us$/, '');

            // Extract the command from the message body after the mention
            const command = msg.body.replace(`@${botNumber}`, '').trim();
            console.log(`Extracted command: "${command}"`); // Log the extracted command

            // Check for commands without the '!' prefix
            if (command.startsWith('prompt')) {
                await handlePromptRequest(msg);
            } else if (['waifu', 'neko', 'shinobu', 'megumin'].includes(command)) {
                await handleWaifuRequest(msg, command);
            } else if (['topaz', 'firefly', 'robin', 'sparkle', 'acheron'].includes(command)) {
                await handleHSRImageRequest(msg, command, Image, 'Honkai Star Rail');
            } else if (command.startsWith('everyone')) {
                await handleEveryoneRequest(msg);
            } else if (command.startsWith('sticker')) {
                await handleStickerRequest(msg);
            } else {
                console.log(`Unknown command: "${command}"`); // Log unknown commands
            }
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