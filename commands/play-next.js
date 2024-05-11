// Libraries
const play = require('./play');
const { masterQueue, queueIndexes, currentInteraction, currentMessage } = require('../index');
const { addToMasterQueue, getQueue, isQueueHere, getCurrentInteractionIndex, getCurrentMessageIndex, changeQueueIndex, getUrlType, getQueueIndex } = require("../helpers/helper_functions");

const { SlashCommandBuilder } = require("discord.js");
const search = require('youtube-search');

const searchOpts = {
    maxResults: 10,
    key: process.env.GOOGLE_API_KEY
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-next')
        .setDescription('Plays the given song immediately after the current song')
        .addStringOption(option =>
            option
                .setName('search')
                .setDescription('The song to play (either the url or a search term)')
                .setRequired(true)),
    async execute(interaction) {
        let guildId = interaction.guild.id;
        let queueIndex = getQueueIndex(guildId);        
        
        let url = interaction.options.getString('search');

        // Checks the type/validity of the url
        let info = await getUrlType(url);
        let urlSite = info[0];
        let urlType = info[1];
        let urlID = info[2];
        queue = []

        // Handles the input being a search term (instead of a url)
        if (urlSite == null) {
            await search(url, searchOpts, (err, results) => {  // For some reason the callback function will always run after the code in this file, hence the repeated code
                if (err) console.err(err);

                url = results[0].link;
                urlSite = 'YT';
                urlType = 'song';
                urlID = results[0].id;

                masterQueue[guildId].splice(queueIndex + 1, 0, {url: url, memberId: interaction.member});
            })
        } else {
            masterQueue[guildId].splice(queueIndex + 1, 0, {url: url, memberId: interaction.member});
        }


        interaction.reply('Added Song')
        setTimeout(() => {
            interaction.deleteReply()
        }, 2000)
    }
}