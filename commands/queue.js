// Libraries
const { masterQueue } = require('../index');
const { getQueueIndex, getYTTitle, getQueue } = require('../helpers/helper_functions');

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const getYoutubeTitle = require('get-youtube-title');
const API_KEY = process.env.GOOGLE_API_KEY
const Spotify = require('spotifydl-core').default;
const { getInfo } = require('yt-converter');

const { createCanvas, loadImage, Image } = require('canvas');
const request = require("request");

const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);

require('dotenv').config();


//Saw a bug a couple times where queue only showed 4 songs, no clue how to recreate
module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the next five songs in the queue - UNDER CONSTRUCTION'),
    async execute(interaction) {
        await interaction.deferReply();
        let queue = getQueue(interaction.guildId);

        let queueIndex = getQueueIndex(interaction.guildId);

        let videoIds = []
        for (let i = 0; i < queue.length; i++) {
            let videoId;
            if (queue[i].url.includes('spotify')) {
                videoId = queue[i].url
            } else {
                videoId = queue[i].url.split('v=')[1]
                if (videoId.includes('&')) {
                    videoId = videoId.split('&')[0]
                }
            }

            videoIds.push(videoId)
        }

        //Sets up framework for moving farther into queue with arrow reactions
        let start = queueIndex;
        let limit;
        if (videoIds.length - start > 7) {
            limit = 7
        } else {
            limit = videoIds.length - start
        }

        // console.log('limit: ' + limit)

        // output = `QUEUE \`\`\`\n`;
        // for (let i = queueIndex; i < queueIndex + limit; i++) {
        //     output += "\n" + i + ": " + await getYTTitle(queue[i].url);
        // }
        // output += `\`\`\``;

        const output = await this.createCanvasOutput(videoIds, start, limit);

        await interaction.editReply(output);
    }, createOutput(text) { //Trying to create an embed to pretty up queue display, UNDER CONSTUCTION
        const outputEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Queue')
            .setURL('https://www.pictureofhotdog.com/')
            .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
            .setDescription('Descriptionda')
            .setThumbnail('https://images.squarespace-cdn.com/content/v1/5dd8630d09ab5908e35b35a0/1574463308006-PDSJDF9EEEB0TJG7TL1N/img-HotDogStock-1080x675.png?format=500w')
            .addFields(
                { name: text }
            )
            .setTimestamp();

        return outputEmbed;
    },
    async createCanvasOutput(videoIds, start, limit) {
        let songsInfo = []
        for (let i = start; i < start + limit; i++) {
            const videoId = videoIds[i];
            const link = `https://www.youtube.com/watch?v=${videoId}`;
            const info = await getInfo(link);

            songsInfo.push({
                thumbnail: info.thumbnails[info.thumbnails.length - 2].url.split('?')[0],
                title: info.title,
                author: info.author.name.replaceAll(' - Topic', '')
            })

            console.log(info.thumbnails);
        }

        // console.log(songsInfo);
        // console.log(videoIds);

        // Initiate the canvas
        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext('2d');

        // Create the background
        ctx.fillStyle = 'rgb(43, 45, 49)';
        ctx.fillRect(0, 0, 800, 450);

        // Draw the thumbnails
        for (let i = 0; i < songsInfo.length; i++) {
            // Draw the border if it is the currently playing song
            if (i === 0) {
                ctx.beginPath();
                ctx.fillStyle = 'rgb(255, 232, 151)';
                ctx.arc(canvas.height / songsInfo.length / 2, (canvas.height / songsInfo.length / 2) + (canvas.height / songsInfo.length * i), (canvas.height / songsInfo.length - 10) / 2 + 5, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.closePath();
            }

            // Draw a circle (stolen from https://stackoverflow.com/questions/69046902/drawing-an-image-inside-a-circle-using-canvas)
            ctx.beginPath();
            ctx.arc(canvas.height / songsInfo.length / 2, (canvas.height / songsInfo.length / 2) + (canvas.height / songsInfo.length * i), (canvas.height / songsInfo.length - 10) / 2, 0, Math.PI * 2, true);
            ctx.closePath();

            // Overlay thumbnail onto the circle
            // PLEASE CLEAN UP THE EQUATIONS OR I WILL CRY THANK YOU
            ctx.save();
            ctx.clip();
            console.log('-------------TEST 1-------------');
            // let image = await loadImage(songsInfo[i].thumbnail);
            const dataURI = await this.getImageDataUri(songsInfo[i].thumbnail);
            // console.log(dataURI);
            let image = await loadImage(songsInfo[i].thumbnail);
            ctx.drawImage(image, canvas.width / (canvas.height / (canvas.height / songsInfo.length - 10)) / 2 - ((canvas.height / songsInfo.length - 10)) - 13, (canvas.height / songsInfo.length * i) - 8, canvas.width / (canvas.height / (canvas.height / songsInfo.length - 10)) + 6, canvas.height / songsInfo.length + 16);
            console.log('-------------TEST 2-------------');
            ctx.restore();

            // Write title and artist
            ctx.font = i !== 0 ? '30px Georgia' : 'bold 30px Arial';
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillText(`${songsInfo[i].title} - ${songsInfo[i].author}`, (canvas.height / songsInfo.length - 10) / 2 + 50, (canvas.height / songsInfo.length / 2) + (canvas.height / songsInfo.length * i) + 10);
        }

        // Create the embed
        // const attachment = new AttachmentBuilder(canvas.toBuffer()); //buffer the canvas and pass it into an Attachment constructor

        // const myEmbed = new EmbedBuilder({
        //     title: 'QUEUE',
        //     color: 0xffe897,
        //     description: 'QUEUE (again)',
        //     image: canvas.toDataURL('image/png')
        // })

        console.log("--------------------Type: " + canvas.type);

        // The message to be sent
        let outputMessage = {
            "content": "",
            "tts": false,
            "files": [{
                attachment: canvas.toBuffer(),
                name: 'queue.png'
            }]
        }

        return outputMessage;
    },      
    async getImageDataUri (url) {
        const extTypeMap = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp'
          };

        try {
          const stream = request(url),
            buffer = await new Promise((resolve, reject) => {
              const chunks = [];
              stream.on("data", (chunk) => chunks.push(chunk));
              stream.on("end", () => resolve(Buffer.concat(chunks)));
              stream.on("error", reject);
            }),
            dataUri = `data:${extTypeMap[url.split(".").pop()] || "image/png"};base64,${buffer.toString("base64")}`;
      
          return dataUri;
        } catch {
          return "";
        }
      }
}