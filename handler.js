require('dotenv').config();
const { MessageMedia } = require('whatsapp-web.js');
const fetch = require("node-fetch");
const { Ollama } = require('ollama');
const ollama = new Ollama({ host: `${process.env.OLLAMA_HOST}` })

const waitTime = 60 * 1000;
let lastFetchTime = null;

const handleWaifuRequest = async (msg, client, body) => {
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

const handleHSRImageRequest = async (msg, client, body, collection, tag) => {
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
                        'Cookie': `z_theme=${process.env.Z_THEME}; z_id=${process.env.Z_ID}; z_hash=${process.env.Z_HASH};`
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

const handleEveryoneRequest = async (msg) => {
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

const handleStickerRequest = async (msg) => {
    if (msg.type === 'image' && msg.hasMedia === true) {
        const media = await msg.downloadMedia();
        await msg.reply(media, msg.from, {
            sendMediaAsSticker: true,
            stickerAuthor: 'Chatbot',
            stickerName: 'Generated Sticker'
        });
    }
};

const handlePromptRequest = async (msg) => {
    const prompt = msg.body.slice(8).trim();
    try {
        // Generate text using Ollama's gemma model
        const generatedText = await ollama.chat({
            model: process.env.OLLAMA_MODEL,
            messages: [{ role: 'user', content: prompt }],
        });

        if (generatedText.message.content.length === 0) {
            await msg.reply('Sorry, the generated text is empty. Please try again with a different prompt.');
            return;
        }

        if (generatedText.message.content.length > 2000) {
            await msg.reply('Sorry, the generated text is too long. Please try again with a shorter prompt.');
            return;
        }

        await msg.reply(generatedText.message.content);
    } catch (error) {
        console.error('Error generating text with Ollama:', error);
        await msg.reply('Sorry, there was an error generating text. Please try again later.');
    }
}

module.exports = {
    handleWaifuRequest,
    handleHSRImageRequest,
    handleEveryoneRequest,
    handleStickerRequest,
    handlePromptRequest
};