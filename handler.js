require('dotenv').config();
const { MessageMedia } = require('whatsapp-web.js');
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const waitTime = 60 * 1000;
let lastFetchTime = null;

const handleWaifuRequest = async (msg, body) => {
    if (!lastFetchTime || Date.now() - lastFetchTime >= waitTime) {
        try {
            const imageUrl = await fetch(`https://api.waifu.pics/sfw/${body}`)
                .then(res => res.json())
                .then(data => data.url);
            const media = await MessageMedia.fromUrl(imageUrl);
            await msg.reply(media, msg.from);
        } catch (error) {
            console.error('Error fetching image:', error);
            msg.reply('Oops! Something went wrong fetching your image.', msg.from);
        } finally {
            lastFetchTime = Date.now();
        }
    } else {
        const cooldownSeconds = waitTime / 1000;
        const remainingSeconds = Math.ceil(cooldownSeconds - (Date.now() - lastFetchTime) / 1000);

        msg.reply(`Mohon tunggu ${remainingSeconds} detik`, msg.from);
    }
};

const handleHSRImageRequest = async (msg, body, collection, tag) => {
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
                await msg.reply(media, msg.from);
            }
            catch (error) {
                console.error('Error fetching image:', error);
                msg.reply('Oops! Something went wrong fetching your image.', msg.from);
            } finally {
                lastFetchTime = Date.now();
            }
        } else {
            const cooldownSeconds = waitTime / 1000;
            const remainingSeconds = Math.ceil(cooldownSeconds - (Date.now() - lastFetchTime) / 1000);

            msg.reply(`Mohon tunggu ${remainingSeconds} detik`, msg.from);
        }
    }
};

const handleEveryoneRequest = async (msg) => {
    const chat = await msg.getChat();
    const adminId = chat.lastMessage.author;
    if (adminId === process.env.ADMIN_ID) {
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = msg.body.replace(/@\d+\s*prompt\s*/g, '').trim();
    if (!lastFetchTime || Date.now() - lastFetchTime >= waitTime) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (text.length === 0) {
                await msg.reply('Sorry, the generated text is empty. Please try again with a different prompt.');
                return;
            }

            if (text.length > 2000) {
                await msg.reply('Sorry, the generated text is too long. Please try again with a shorter prompt.');
                return;
            }

            await msg.reply(text);
        } catch (error) {
            console.error('Error generating text with Ollama:', error);
            await msg.reply('Sorry, there was an error generating text. Please try again later.');
        } finally {
            lastFetchTime = Date.now();
        }
    } else {
        const cooldownSeconds = waitTime / 1000;
        const remainingSeconds = Math.ceil(cooldownSeconds - (Date.now() - lastFetchTime) / 1000);

        msg.reply(`Mohon tunggu ${remainingSeconds} detik`, msg.from);
    }
}

module.exports = {
    handleWaifuRequest,
    handleHSRImageRequest,
    handleEveryoneRequest,
    handleStickerRequest,
    handlePromptRequest
};