// Libraries
const { masterQueue } = require('../index');
const { getQueueIndex } = require('../helpers/helper_functions');

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
        let queue = this.getQueue(interaction.guildId);
        console.log(queue)

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

        console.log('limit: ' + limit)

        await this.getTitles(interaction, videoIds, start, '', start, limit)
    },
    getQueue(guildId) {
        let queue = []
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == guildId) {
                queue.push(masterQueue[i][1]);
            }
        }
        return queue
    },
    async getTitles(interaction, videoIds, numTitles, startText, ogNumTitle, limit) {
        //Recursive, goes through itself *limit* times, only outputs one the fifth time
        //Probably not amazing but fixed problem where ending code ran before callback functions
        //Could prob make for loop where reply inside callback  (Tried this, didn't work, callbacks were still called in a random order)
        if (numTitles < ogNumTitle + limit) {
            let queueIndex = getQueueIndex(interaction.guildId);

            if (videoIds[numTitles].includes('spotify')) {
                await spotify.getTrack(videoIds[numTitles]).then(async (title) => {
                    startText += (numTitles + 1 - queueIndex) + ': ' + title.name + '\n';

                    let test = await this.getTitles(interaction, videoIds, numTitles + 1, startText, ogNumTitle, limit)
                    if (test) {
                        startText = test + startText
                    }

                    if (numTitles == ogNumTitle + limit - 1) {
                        await interaction.reply(`\`\`\`---QUEUE---\n${startText}\`\`\``)
                    }
                    return startText;
                })
            } else {
                getYoutubeTitle(videoIds[numTitles], API_KEY, async (err, title) => {
                    if (err) {
                        console.error(err)
                    } else {
                        startText += (numTitles + 1 - queueIndex) + ': ' + title + '\n';
                    }
                    let test = await this.getTitles(interaction, videoIds, numTitles + 1, startText, ogNumTitle, limit)
                    if (test) {
                        startText = test + startText
                    }

                    if (numTitles == ogNumTitle + limit - 1) {
                        //await interaction.reply(':sob:')
                        await interaction.reply(`QUEUE \`\`\`${startText}\`\`\``)
                    }
                    return startText;
                })
            }
        }
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