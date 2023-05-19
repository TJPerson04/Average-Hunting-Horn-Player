const { SlashCommandBuilder, Guild, filter } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { join } = require('node:path');
const Spotify = require('spotifydl-core').default;
const { masterQueue } = require('../index');
const ytConverter = require('yt-converter');
const fs = require('fs');
const PlaylistSummary = require('youtube-playlist-summary')
const { getQueue, playYTVideo, playSpotifySong, playNextSong } = require("../helpers/helper_functions");
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
        //Show what's currently playing, prob delete old "currently playing" message and make a new one
        //Add ability to play spotify albums as well as playlists

        const textChannel = interaction.channel;
        let voiceChannelId;
        if (interaction.member.voice.channel) {
            voiceChannelId = interaction.member.voice.channel.id;
        } else {
            await interaction.reply('You must be in a voice channel to use this command');
            return
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
        let player;

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
            const config = {
                GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, // require
                PLAYLIST_ITEM_KEY: ['videoUrl'], // option
            }

            const ps = new PlaylistSummary(config)
            const PLAY_LIST_ID = url.split('list=')[1] //Gets the id from the url

            //This is so it doesn't time out waiting for a response, breaking it
            await interaction.reply(`Currently playing ${url} (probably)`)

            await ps.getPlaylistItems(PLAY_LIST_ID)
                .then(async (result) => {
                    queue = getQueue(textChannel.guild.id, false)

                    if (queue.length == 0) {
                        playYTVideo(interaction.guildId, result.items[0].videoUrl);
                        //await interaction.reply(`Playing ${url}`);
                    } else {
                        //await interaction.reply('Added to the queue');
                    }

                    for (let i = 0; i < result.items.length; i++) {
                        masterQueue.push([textChannel.guild.id, result.items[i].videoUrl, interaction.member]);
                    }
                })
                .catch((error) => {
                    console.error(error)
                })
        } else if (url.includes('playlist') && url.includes('spotify')) {
            await interaction.reply('It prob worked')

            await spotify.getPlaylist(url).then(async (result) => {
                queue = getQueue(textChannel.guild.id, false)
                let tracks = result.tracks;

                if (queue.length == 0) {
                    playSpotifySong(interaction.guildId, 'https://open.spotify.com/track/' + tracks[0]);
                    //await interaction.reply(`Playing ${url}`);
                } else {
                    //await interaction.reply('Added to the queue');
                }

                for (let i = 0; i < tracks.length; i++) {
                    masterQueue.push([textChannel.guild.id, 'https://open.spotify.com/track/' + tracks[i], interaction.member])
                }
            })
                .catch((error) => {
                    console.error(error)
                })
        } else {
            if (url.includes('youtu.be')) { //Reformats mobile links
                url = 'https://www.youtube.com/watch?v=' + url.split('/')[url.split('/').length - 1]
            }
            masterQueue.push([textChannel.guild.id, url, interaction.member]);
            queue = getQueue(textChannel.guild.id, false)
        }

        if (queue.length == 1 && !url.includes('playlist')) {
            if (url.includes('spotify')) {
                playSpotifySong(interaction.guildId, url);
            } else {
                playYTVideo(interaction.guildId, url);
            }
            await interaction.reply(`Playing ${url}`);
        } else if (!url.includes('playlist') && (url.includes('youtube') || url.includes('spotify'))) {
            await interaction.reply(`Added ${url} to the queue`);
        }
    }
}
