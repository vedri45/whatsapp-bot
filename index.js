const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
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

client.on('message', async (msg) => {
    if (msg.body === '!random' || '!waifu' || '!neko' || '!megumin') {
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
        }
    }
});


client.initialize();