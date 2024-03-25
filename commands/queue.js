// Libraries
const { masterQueue } = require('../index');
const { getQueueIndex, getYTTitle, getQueue } = require('../helpers/helper_functions');

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const getYoutubeTitle = require('get-youtube-title');
const API_KEY = process.env.GOOGLE_API_KEY
const Spotify = require('spotifydl-core').default;

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
        let queue = getQueue(interaction.guildId, false);

        let queueIndex = getQueueIndex(interaction.guildId);

        let videoIds = []
        for (let i = 0; i < queue.length; i++) {
            let videoId;
            if (queue[i].includes('spotify')) {
                videoId = queue[i]
            } else {
                videoId = queue[i].split('v=')[1]
                if (videoId.includes('&')) {
                    videoId = videoId.split('&')[0]
                }
            }

            videoIds.push(videoId)
        }

        //Sets up framework for moving farther into queue with arrow reactions
        let start = queueIndex;
        let limit;
        if (videoIds.length - start > 5) {
            limit = 5
        } else {
            limit = videoIds.length - start
        }

        // console.log('limit: ' + limit)

        output = `QUEUE \`\`\`\n`;
        for (let i = queueIndex; i < queueIndex + limit; i++) {
            output += "\n" + i + ": " + await getYTTitle(queue[i]);
        }
        output += `\`\`\``;

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
    }
}