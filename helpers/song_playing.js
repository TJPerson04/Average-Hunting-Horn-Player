// Libraries
const { masterQueue, queueIndexes, isLooping, } = require('../index');
const {displayDownloadPercent, manageDisplay} = require('./display');
const { getQueue, getQueueIndex } = require('./helper_functions');

const { createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayer } = require('@discordjs/voice');
const PlaylistSummary = require('youtube-playlist-summary');
const ytConverter = require('yt-converter');
const fs = require('fs');
const { join } = require('node:path');
const Spotify = require('spotifydl-core').default

const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);


module.exports = {
    /**
     * Plays a youtube video through a voice connection in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} url The url of the video to play
     * @returns {AudioPlayer} The player that is playing the song
     */
    async playYTVideo(guildId, url) {
        console.log('Downloading\x1b[36m', url, '\x1b[0m');

        
        let connection = getVoiceConnection(guildId)
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
            ytConverter.convertAudio({
                url: url,
                directoryDownload: __dirname + '\\..\\files\\songs',
                itag: 140
            }, async (perc) => {
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
            }, async () => {
                await ytConverter.getInfo(url).then(async info => {
                    let titleOrig = info.title;
                    //Downloaded files can't handle colons, so this removes them
                    title = titleOrig.replaceAll(':', '').replaceAll('|', '').replaceAll(',', '').replaceAll('\\', '').replaceAll('/', '').replaceAll('?', '').replaceAll('"', '').replaceAll('*', '');

                    //Makes sure that if the skip/previous button is spammed, only the correct song actually plays
                    //Doesn't really work that well tbh (It said "this.getQueue is not a function")
                    let queue = getQueue(guildId, false);
                    let currentUrl = queue[getQueueIndex(guildId)];

                    try {
                        if (url == currentUrl) {
                            fs.renameSync(join(__dirname, '\\..\\files\\songs\\', title) + '.mp3', join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
                        } else {
                            fs.unlinkSync(join(__dirname, '\\..\\files\\songs\\', title) + '.mp3');
                        }
                    } catch (err) {
                        console.error(err)
                    }



                    let resource;
                    try {
                        resource = createAudioResource(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'))
                    } catch {
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
            })
        } catch {
            this.playYTVideo(guildId, url)
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
            fs.unlinkSync(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
        } catch (err) {
            console.error(err)
        }

        const connection = getVoiceConnection(guildId);
        const player = createAudioPlayer();

        console.log('LINK - Creating resource for ' + url)
        await spotify.downloadTrack(url, 'song_' + guildId + '.mp3');

        fs.rename('song_' + guildId + '.mp3', join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'), (err) => {
            if (err) throw err;
        });

        let resource = createAudioResource(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
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
        let queueIndex = 0;
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                queueIndexes[i][0]++;
                queueIndex = queueIndexes[i][0];
                break;
            }
        }

        //Re-defines server specific queue based on masterQueue
        queue = getQueue(guildId, false);
        console.log(queueIndex);
        let connection = getVoiceConnection(guildId);

        if (queueIndex < queue.length) {
            if (queue[queueIndex].includes('youtube')) {
                await module.exports.playYTVideo(guildId, queue[queueIndex]);
            } else if (queue[queueIndex].includes('spotify')) {
                module.exports.playSpotifySong(guildId, queue[queueIndex]);
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
                for (let i = 0; i < masterQueue.length; i++) {
                    if (masterQueue[i][0] == guildId) {
                        masterQueue.splice(i, 1);
                        i = 0;
                    }
                }
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
                queue = getQueue(guildId, false)

                if (queue.length == 0) {
                    await module.exports.playYTVideo(guildId, result.items[0].videoUrl);
                }

                for (let i = 0; i < result.items.length; i++) {
                    masterQueue.push([guildId, result.items[i].videoUrl, userId]);
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
            queue = getQueue(guildId, false)
            let tracks = result.tracks;

            if (queue.length == 0) {
                module.exports.playSpotifySong(guildId, 'https://open.spotify.com/track/' + tracks[0]);
            }

            for (let i = 0; i < tracks.length; i++) {
                masterQueue.push([guildId, 'https://open.spotify.com/track/' + tracks[i], userId])
            }
        })
            .catch((error) => {
                console.error(error)
            })
    },
}