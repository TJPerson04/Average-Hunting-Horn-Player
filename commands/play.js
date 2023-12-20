const { SlashCommandBuilder, Guild, filter, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const Spotify = require('spotifydl-core').default;
const { masterQueue, isQueueSetUp, queueIndexes, currentInteraction, currentMessage } = require('../index');
const { getQueue, playYTVideo, playSpotifySong, addYTPlaylist, addSpotifyPlaylist, isQueueHere, getCurrentInteractionIndex, getCurrentMessageIndex, changeQueueIndex } = require("../helpers/helper_functions");
const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);

require('dotenv').config();

let queue = []

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays the audio of a youtube video')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('The youtube video to play')
                .setRequired(true)),
    async execute(interaction) {
        //TODO:
        //Be able to look at songs in queue (currently sometimes doesn't show current song playing)
        //Add ability to play spotify albums as well as playlists
        //Make currentMessage and currentInteraction able to be used in multiple servers

        let message = await interaction.deferReply({ fetchReply: true });

        //Checks if server has current interaction/message
        //If so, updates not, otherwise adds one
        let currentInteractionIndex = getCurrentInteractionIndex(interaction.guildId);
        let currentMessageIndex = getCurrentMessageIndex(interaction.guildId);

        currentInteractionIndex ? currentInteraction[currentInteractionIndex][1] = interaction : currentInteraction.push([interaction.guildId, interaction]);
        currentMessageIndex ? currentMessage[currentMessageIndex][1] = message : currentMessage.push([interaction.guildId, message]);

        if (!isQueueHere(interaction.guildId)) {
            queueIndexes.push([0, interaction.guildId]);
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
            await interaction.reply('You must be in a voice channel to use this command');
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

        if (!url.includes('youtube') && !url.includes('spotify') && !url.includes('youtu.be')) {
            interaction.reply("That's not a valid link");
            return;
        }

        queue = []

        if (url.includes('playlist') && url.includes('youtube')) {
            //This is so it doesn't time out waiting for a response, breaking it
            //await interaction.reply(`Currently playing ${url} (probably)`)
            addYTPlaylist(interaction.guild.id, interaction.user.id, url)
        } else if (url.includes('playlist') && url.includes('spotify')) {
            //await interaction.reply('It prob worked')
            addSpotifyPlaylist(interaction.guild.id, interaction.user.id, url)
        } else {
            if (url.includes('youtu.be')) { //Reformats mobile links
                url = 'https://www.youtube.com/watch?v=' + url.split('/')[url.split('/').length - 1]
            }
            masterQueue.push([textChannel.guild.id, url, interaction.member]);
            queue = getQueue(textChannel.guild.id, false)
        }

        if (queue.length == 1 && !url.includes('playlist')) {
            if (url.includes('spotify')) {
                currentInteraction.push(interaction);
                playSpotifySong(interaction.guildId, url);
            } else {
                currentInteraction.push(interaction);
                playYTVideo(interaction.guildId, url);
            }
            //let message = await interaction.deferReply({ fetchReply: true });
            //currentMessage.push(message);
        } else if (!url.includes('playlist') && (url.includes('youtube') || url.includes('spotify'))) {
            //await interaction.reply(`Added ${url} to the queue`);
        }
    }
}
