const { SlashCommandBuilder, Guild, filter } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
require('dotenv').config();
const { join } = require('node:path');
const Spotify = require('spotifydl-core').default;
const index = require('../index');
const { masterQueue } = require('../index');
const ytConverter = require('yt-converter');
const fs = require('fs');
const PlaylistSummary = require('youtube-playlist-summary')
//const ytlist = require('youtube-playlist');
//const ytAPI_KEY = 'AIzaSyBL2Kk6Ui2WvtQsxbROeAftoEbgk7HFH8c';
//const ytdl = require('ytdl-core');
//const { createReadStream } = require('node:fs');

const spotifyCredentials = {
    clientId: '4918ed15767d429695e6fbb30e73f713',  //Should probably move these to the .env file
    clientSecret: '48e6f6221d824805bf47dbfe37bfa713'
}
const spotify = new Spotify(spotifyCredentials);

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
        //Get the bot to leave the vc once done

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

        let url = interaction.options.getString('url');

        if (!url.includes('youtube') && !url.includes('spotify') && !url.includes('youtu.be')) {
            interaction.reply("That's not a valid link");
            return;
        }

        queue = []

        if (url.includes('playlist') && url.includes('youtube')) {
            const config = {
                GOOGLE_API_KEY: 'AIzaSyBL2Kk6Ui2WvtQsxbROeAftoEbgk7HFH8c', // require
                PLAYLIST_ITEM_KEY: ['videoUrl'], // option
            }

            const ps = new PlaylistSummary(config)
            const PLAY_LIST_ID = url.split('list=')[1] //Gets the id from the url

            //This is so it doesn't time out waiting for a response, breaking it
            await interaction.reply(`Currently playing ${url} (probably)`)

            await ps.getPlaylistItems(PLAY_LIST_ID)
                .then(async (result) => {
                    queue = this.getQueue(textChannel.guild.id)

                    if (queue.length == 0) {
                        this.playYTVideo(interaction.guildId, result.items[0].videoUrl);
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
                queue = this.getQueue(textChannel.guild.id)
                let tracks = result.tracks;

                if (queue.length == 0) {
                    this.playYTVideo(interaction.guildId, 'https://open.spotify.com/track/' + tracks[0]);
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
            queue = this.getQueue(textChannel.guild.id)
        }

        if (queue.length == 1 && !url.includes('playlist')) {
            this.playYTVideo(interaction.guildId, url);
            await interaction.reply(`Playing ${url}`);
        } else if (!url.includes('playlist') && (url.includes('youtube') || url.includes('spotify'))) {
            await interaction.reply(`Added ${url} to the queue`);
        }

    },
    async playYTVideo(guildId, url) {
        let connection = getVoiceConnection(guildId);
        let resource;
        const player = createAudioPlayer();

        if (url.includes('youtube')) {
            //Downloads youtube url as mp3, then turns that into an audio resource that works w/ connection
            try {
                fs.unlinkSync(join(__dirname, '\\..\\song_' + guildId + '.mp3'));
            } catch(err) {
                console.error(err)
            }
            await ytConverter.convertAudio({
                url: url,
                itag: 140,
                directoryDownload: __dirname + '\\..',
                title: "song_" + guildId
            }, () => { }, () => {
                resource = createAudioResource(join(__dirname, '\\..\\song_' + guildId + '.mp3'))
                
                connection.subscribe(player);
                player.play(resource);

                if (this.isZoomerModeOn(guildId)) {
                    setTimeout(() => {
                        player.play(createAudioResource(join(__dirname, '\\..\\portal_radio.mp3')))
                        player.stop()
                    }, 10000)
                }
            })

        } else if (url.includes('spotify')) {
            console.log('LINK - Creating resource for ' + url)
            resource = createAudioResource(await spotify.downloadTrack(url, 'song_' + guildId + '.mp3'));
            
            connection.subscribe(player);
            player.play(resource);

            if (this.isZoomerModeOn(guildId)) {
                setTimeout(() => {
                    player.play(createAudioResource(join(__dirname, '\\..\\portal_radio.mp3')))
                    player.stop()
                }, 10000)
            }
        }

        //Waits until song stops, then removes it from the queue and moves to the next song
        player.addListener("stateChange", async (oldOne, newOne) => {
            if (newOne.status == "idle") {
                //Removes song from masterQueue
                for (let i = 0; i < masterQueue.length; i++) {
                    if (masterQueue[i][0] == guildId) {
                        masterQueue.splice(i, 1);
                        break;
                    }
                }

                //Re-defines server specific queue based on masterQueue
                queue = this.getQueue(guildId)
                console.log(queue.length)

                //Plays the next song if there are still more in the queue
                if (queue.length > 0) {
                    let resource;
                    if (queue[0].includes('youtube')) {
                        //This was creating the resource before yt-converter, scared to get rid of it
                        /*resource = createAudioResource(ytdl(queue[0], {
                            filter: 'audioonly',
                            quality: 'highestaudio',
                            highWaterMark: 1 << 25
                        }))*/

                        try {
                            fs.unlinkSync(join(__dirname, '\\..\\song_' + guildId + '.mp3'))
                        } catch(err) {
                            console.error(err)
                        }

                        await ytConverter.convertAudio({
                            url: queue[0],
                            itag: 140,
                            directoryDownload: __dirname + '\\..',
                            title: "song_" + guildId
                        }, () => { }, () => {
                            resource = createAudioResource(join(__dirname, '\\..\\song_' + guildId + '.mp3'))
                            console.log(player);
                            player.play(resource);

                            if (this.isZoomerModeOn(guildId)) {
                                setTimeout(() => {
                                    player.play(createAudioResource(join(__dirname, '\\..\\portal_radio.mp3')))
                                    player.stop()
                                }, 10000)
                            }
                        })
                    } else if (queue[0].includes('spotify')) {
                        console.log('QUEUE - Creating resource for ' + queue[0])
                        resource = createAudioResource(await spotify.downloadTrack(queue[0], 'song_' + guildId + '.mp3'))
                        player.play(resource)

                        if (this.isZoomerModeOn(guildId)) {
                            setTimeout(() => {
                                player.play(createAudioResource(join(__dirname, '\\..\\portal_radio.mp3')))
                                player.stop()
                            }, 10000)
                        }
                    }
                    console.log('Moving to next song');
                } else {
                    console.log('Reched the end of the queue');
                    connection.disconnect();
                    connection.destroy();
                }
            }
        });

        player.on('error', err => {
            console.error(err);
        })
    },
    //Creates server specific queue
    getQueue(guildId) {
        let queue = []
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == guildId) {
                queue.push(masterQueue[i][1]);
            }
        }
        return queue
    },
    //Checks if zoomer mode is on for a specific guild
    isZoomerModeOn(guildId) {
        for (let i = 0; i < index.zoomerMode.length; i++) {
            if (index.zoomerMode[i][1] == guildId) {
                return index.zoomerMode[i][0]
            }
        }

        return false
    }
}
