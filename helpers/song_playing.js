// Libraries
const { masterQueue, queueIndexes, isLooping, } = require('../index');
const { displayDownloadPercent, manageDisplay } = require('./display');
const { getQueue, getQueueIndex, removeFromMasterQueue, addToMasterQueue } = require('./helper_functions');

const { createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayer } = require('@discordjs/voice');
const PlaylistSummary = require('youtube-playlist-summary');
const ytConverter = require('yt-converter');
// const { Audio, Video } = require('yt-converter');
const { YtDlp } = require('ytdlp-nodejs');
const fs = require('fs');
const { join } = require('node:path');
const Spotify = require('spotifydl-core').default

const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);

const ytdlp = new YtDlp();


module.exports = {
    /**
     * Plays a youtube video through a voice connection in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} url The url of the video to play
     * @returns {AudioPlayer} The player that is playing the song
     */
    async playYTVideo(guildId, url) {
        console.log('Downloading\x1b[36m', url, '\x1b[0m');


        let connection = getVoiceConnection(guildId);
        const player = createAudioPlayer();

        //Removes old song if there
        try {
            //fs.unlinkSync(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
        } catch (err) {
            console.log('AN ERROR OCCURED')
            console.error(err)
        }

        //Downloads youtube url as mp3, then turns that into an audio resource that works w/ connection
        try {
            const data = await ytdlp.downloadAsync(
                url,
                {
                    onProgress: async (res) => {
                        let perc = res.percentage;
                        console.log('\x1b[33m' + perc.toFixed(2) + "%\x1b[0m");
                        await ytConverter.getInfo(url).then(async info => {
                            let thumbnailUrl = info.thumbnails[info.thumbnails.length - 1].url
                            let singer = info.author.name
                            let channelUrl = info.author.channel_url
                            if (singer.includes("- Topic")) {
                                singer = singer.replaceAll("- Topic", "")  // For some reason a lot of the authors have "- Topic" at the end and it is annoying
                            }
                            displayDownloadPercent(perc, guildId, url, info.title, thumbnailUrl, singer, channelUrl)
                        })
                    },
                    format: {
                        filter: 'audioonly',
                    }
                })
            console.log('----------DATA----------');
            let titleActual = data.split('[ExtractAudio] Destination: ')[1].split('.mp3')[0];
            console.log(titleActual);
            await ytConverter.getInfo(url).then(async info => {
                let titleOrig = info.title;
                //Downloaded files can't handle colons, so this removes them
                // title = titleOrig.replaceAll(':', '').replaceAll('|', '').replaceAll(',', '').replaceAll('\\', '').replaceAll('/', '').replaceAll('?', '').replaceAll('"', '').replaceAll('*', '');

                title = titleActual;

                //Makes sure that if the skip/previous button is spammed, only the correct song actually plays
                //Doesn't really work that well tbh (It said "this.getQueue is not a function")
                let queue = getQueue(guildId);
                let currentUrl = queue[getQueueIndex(guildId)].url;

                try {
                    if (url == currentUrl) {
                        // fs.renameSync(join(__dirname, '/../files/songs/', title) + '.mp3', join(__dirname, '/../files/songs/song_' + guildId + '.mp3'));
                        fs.renameSync(join(__dirname, '/../', title) + '.mp3', join(__dirname, '/../files/songs/song_' + guildId + '.mp3'));
                    } else {
                        // fs.unlinkSync(join(__dirname, '/../files/songs/', title) + '.mp3');
                        fs.unlinkSync(join(__dirname, '/../', title) + '.mp3');
                    }
                } catch (err) {
                    console.error(err)
                }



                let resource;
                try {
                    resource = createAudioResource(join(__dirname, '/../files/songs/song_' + guildId + '.mp3'))
                } catch (err) {
                    console.log(err);
                }

                connection.subscribe(player);
                player.play(resource);
                console.log('Now playing \x1b[36m' + url + '\x1b[0m')
                player.addListener('stateChange', async (oldOne, newOne) => {
                    if (newOne.status == "idle") {
                        module.exports.playNextSong(guildId);
                    }
                })

                let thumbnailUrl = info.thumbnails[info.thumbnails.length - 1].url
                let singer = info.author.name
                let channelUrl = info.author.channel_url
                if (singer.includes("- Topic")) {
                    singer = singer.replaceAll("- Topic", "")  // For some reason a lot of the authors have "- Topic" at the end and it is annoying
                }

                manageDisplay(url, guildId, titleOrig, thumbnailUrl, singer, channelUrl);
            });
        } catch (err) {
            console.log(err);
            // THIS SHOULD INCREMENT THE QUEUE INDEX
            module.exports.playYTVideo(guildId, url)
        }



        return player;
    },

    /**
     * Plays a song from spotify through a voice connection in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} url The url of the song to play
     * @returns {AudioPlayer} The player that is playing the song
     */
    async playSpotifySong(guildId, url) {
        console.log('wut')
        console.log('Downloading\x1b[36m', url, '\x1b[0m');
        //Removes old song if there
        try {
            fs.unlinkSync(join(__dirname, '/../files/songs/song_' + guildId + '.mp3'));
        } catch (err) {
            console.error(err)
        }

        const connection = getVoiceConnection(guildId);
        const player = createAudioPlayer();

        console.log('LINK - Creating resource for ' + url)
        await spotify.downloadTrack(url, 'song_' + guildId + '.mp3');

        fs.rename('song_' + guildId + '.mp3', join(__dirname, '/../files/songs/song_' + guildId + '.mp3'), (err) => {
            if (err) throw err;
        });

        let resource = createAudioResource(join(__dirname, '/../files/songs/song_' + guildId + '.mp3'));
        connection.subscribe(player);
        player.play(resource);
        player.addListener('stateChange', async (oldOne, newOne) => {
            if (newOne.status == "idle") {
                module.exports.playNextSong(guildId);
            }
        })
        return player;
    },

    /**
     * Goes to the next song in the queue
     * Also updates the queue
     * @param {String} guildId The id of the discord server the bot is playing in
     */
    async playNextSong(guildId) {
        //Increses the index of the queue by 1
        let queueIndex = ++queueIndexes[guildId];

        //Re-defines server specific queue based on masterQueue
        queue = getQueue(guildId);
        let connection = getVoiceConnection(guildId);

        if (queueIndex < queue.length) {
            if (queue[queueIndex].url.includes('youtube')) {
                await module.exports.playYTVideo(guildId, queue[queueIndex].url);
            } else if (queue[queueIndex].url.includes('spotify')) {
                module.exports.playSpotifySong(guildId, queue[queueIndex].url);
            }
            console.log('Moving to next song');
        } else {
            isQueueLooping = false;
            for (let i = 0; i < isLooping.length; i++) {
                if (isLooping[i][1] == guildId) {
                    isQueueLooping = isLooping[i][1]
                    break;
                }
            }

            if (isQueueLooping) {
                for (let i = 0; i < queueIndexes.length; i++) {
                    if (queueIndexes[i][1] == guildId) {
                        queueIndexes[i][0] = -1;
                        module.exports.playNextSong(guildId);
                        break;
                    }
                }
            } else {
                console.log('Reached the end of the queue');

                // Resets to queueIndex to 0
                for (let i = 0; i < queueIndexes.length; i++) {
                    if (queueIndexes[i][1] == guildId) {
                        queueIndexes[i][0] = 0;
                        break;
                    }
                }

                // Clears queue
                removeFromMasterQueue(guildId);
                connection.disconnect();
                connection.destroy();
            }
        }
    },

    /**
     * Adds a every url in a youtube playlist to the queue
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} userId The id of the user who added the playlist
     * @param {String} url The url of the playlist
     */
    async addYTPlaylist(guildId, userId, url) {
        const config = {
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, // require
            PLAYLIST_ITEM_KEY: ['videoUrl'], // option
        }

        const ps = new PlaylistSummary(config)
        const PLAY_LIST_ID = url.split('list=')[1] //Gets the id from the url

        await ps.getPlaylistItems(PLAY_LIST_ID)
            .then(async (result) => {
                console.log('----------PLAYLIST----------');
                console.log(PLAY_LIST_ID);
                queue = getQueue(guildId)

                if (!queue || queue.length <= 1) {
                    module.exports.playYTVideo(guildId, result.items[0].videoUrl);
                }

                for (let i = 0; i < result.items.length; i++) {
                    addToMasterQueue(guildId, result.items[i].videoUrl, userId);
                }
            })
            .catch((error) => {
                console.error(error)
            })
    },

    /**
     * Adds every url in a spotify playlist to the queue of a given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} userId The id of the user who added the playlist
     * @param {String} url The url of the playlist
     */
    async addSpotifyPlaylist(guildId, userId, url) {
        await spotify.getPlaylist(url).then(async (result) => {
            queue = getQueue(guildId)
            let tracks = result.tracks;

            if (queue.length == 0) {
                module.exports.playSpotifySong(guildId, 'https://open.spotify.com/track/' + tracks[0]);
            }

            for (let i = 0; i < tracks.length; i++) {
                addToMasterQueue(guildId, 'https://open.spotify.com/track/' + tracks[i], userId);
            }
        })
            .catch((error) => {
                console.error(error)
            })
    },
}