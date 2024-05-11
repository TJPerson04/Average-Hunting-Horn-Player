// Libraries
const { masterQueue, queueIndexes, currentInteraction, currentMessage } = require('../index');
const { getQueue, isQueueHere, getCurrentInteractionIndex, getCurrentMessageIndex, changeQueueIndex, getUrlType, addToMasterQueue } = require("../helpers/helper_functions");
const { playYTVideo, playSpotifySong, addYTPlaylist, addSpotifyPlaylist } = require('../helpers/song_playing');

const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const Spotify = require('spotifydl-core').default;
const search = require('youtube-search');

const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);

const searchOpts = {
    maxResults: 10,
    key: process.env.GOOGLE_API_KEY
}

require('dotenv').config();


let queue = []

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays the audio of a youtube video')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('The song to play (either the url or a search term)')
                .setRequired(true)),
    async execute(interaction) {
        // Sends initial "bot is thinking" message (so it doesn't timeout)
        let message = await interaction.deferReply({ fetchReply: true });

        //Checks if server has current interaction/message
        //If so, updates not, otherwise adds one
        let currentInteractionIndex = getCurrentInteractionIndex(interaction.guildId);
        let currentMessageIndex = getCurrentMessageIndex(interaction.guildId);

        currentInteractionIndex ? currentInteraction[currentInteractionIndex][1] = interaction : currentInteraction.push([interaction.guildId, interaction]);
        currentMessageIndex ? currentMessage[currentMessageIndex][1] = message : currentMessage.push([interaction.guildId, message]);

        if (!isQueueHere(interaction.guildId)) {
            queueIndexes[interaction.guildId] = 0;
        } else {
            if (getQueue(interaction.guildId).length == 0) {
                changeQueueIndex(interaction.guildId, 0);
            }
        }

        const textChannel = interaction.channel;
        let voiceChannelId;
        if (interaction.member.voice.channel) {
            voiceChannelId = interaction.member.voice.channel.id;
        } else {
            await interaction.editReply('You must be in a voice channel to use this command');
            return;
        }

        let connection;
        if (getVoiceConnection(interaction.guildId)) {
            connection = getVoiceConnection(interaction.guildId);
        } else {
            connection = joinVoiceChannel({
                channelId: voiceChannelId,
                guildId: textChannel.guild.id,
                adapterCreator: textChannel.guild.voiceAdapterCreator,
            })
        }

        //I have absolutely no clue what this bit of code does, stole it off the internet and it fixed a bug
        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        }

        connection.on('stateChange', (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');

            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
        });

        let url = interaction.options.getString('url');

        // Checks the type/validity of the url
        let info = await getUrlType(url);
        let urlSite = info[0];
        let urlType = info[1];
        let urlID = info[2];
        console.log(info)
        queue = [];

        // Handles the input being a search term (instead of a url)
        if (urlSite == null) {
            await search(url, searchOpts, (err, results) => {  // For some reason the callback function will always run after the code in this file, hence the repeated code
                if (err) console.error(err);

                // console.log(results);
                url = results[0].link;
                urlSite = 'YT';
                urlType = 'song';
                urlID = results[0].id;

                addToMasterQueue(textChannel.guild.id, url, interaction.member);
                queue = getQueue(textChannel.guild.id);

                if (queue.length == 1) {
                    currentInteraction.push(interaction);
                    playYTVideo(interaction.guildId, url);
                }
            })
        } else {  // If the url is an actual url (and not a search term)
            if (urlSite == 'YT' && urlType == 'playlist') {
                addYTPlaylist(interaction.guild.id, interaction.user.id, url)
            } else if (urlSite == 'spotify' && urlType == 'playlist') {
                addSpotifyPlaylist(interaction.guild.id, interaction.user.id, url)
            } else if (urlType == 'song') {
                if (url.includes('youtu.be')) { //Reformats mobile links
                    url = 'https://www.youtube.com/watch?v=' + urlID;
                }
                addToMasterQueue(textChannel.guild.id, url, interaction.member);
                queue = getQueue(textChannel.guild.id);
            }
        }

        if (queue.length == 1 && !url.includes('playlist')) {
            if (url.includes('spotify')) {
                currentInteraction.push(interaction);
                playSpotifySong(interaction.guildId, url);
            } else {
                currentInteraction.push(interaction);
                playYTVideo(interaction.guildId, url);
            }
        }

        if (currentInteraction[currentInteractionIndex] && currentInteraction[currentInteractionIndex][1] != interaction) {
            interaction.editReply('Added Song')
            setTimeout(() => {
                interaction.deleteReply()
            }, 2000)
        }
    }
}
