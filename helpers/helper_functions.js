const { masterQueue } = require('../index');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const ytConverter = require('yt-converter');
const fs = require('fs');
const { join } = require('node:path');
const Spotify = require('spotifydl-core').default;
const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);


module.exports = {
    //Creates server specific queue
    getQueue(guildId, isWithMembers) {
        let queue = []
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == guildId) {
                if (isWithMembers) {
                    queue.push([masterQueue[i][1], masterQueue[i][2]]);
                } else {
                    queue.push(masterQueue[i][1]);
                }
            }
        }
        return queue
    },
    async playYTVideo(guildId, url) {
        let connection = getVoiceConnection(guildId)
        const player = createAudioPlayer();

        //Removes old song if there
        try {
            fs.unlinkSync(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
        } catch (err) {
            console.error(err)
        }

        //Downloads youtube url as mp3, then turns that into an audio resource that works w/ connection
        await ytConverter.convertAudio({
            url: url,
            itag: 140,
            directoryDownload: __dirname + '\\..\\files\\songs',
            title: "song_" + guildId
        }, () => { }, async () => {
            await ytConverter.getInfo(url).then(info => {
                let title = info.title;
                //Downloaded files can't handle colons, so this removes them
                title = title.replaceAll(':', '').replaceAll('|', '').replaceAll(',', '').replaceAll('\\', '').replaceAll('/', '').replaceAll('?', '').replaceAll('"', '');

                fs.renameSync(join(__dirname, '\\..\\files\\songs\\', title) + '.mp3', join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
                let resource = createAudioResource(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'))

                connection.subscribe(player);
                player.play(resource);
                player.addListener('stateChange', async (oldOne, newOne) => {
                    if (newOne.status == "idle") {
                        module.exports.playNextSong(guildId);
                    }})
            });
        })

        return player;
    },
    async playSpotifySong(guildId, url) {
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
            }})
        return player;
    },
    playNextSong(guildId) {
        //Removes song from masterQueue
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == guildId) {
                masterQueue.splice(i, 1);
                break;
            }
        }

        //Re-defines server specific queue based on masterQueue
        queue = module.exports.getQueue(guildId, false)
        console.log(queue.length)

        if (queue.length > 0) {
            if (queue[0].includes('youtube')) {
                module.exports.playYTVideo(guildId, queue[0])
            } else if (queue[0].includes('spotify')) {
                module.exports.playSpotifySong(guildId, queue[0])
            }
            console.log('Moving to next song');
        } else {
            console.log('Reched the end of the queue');
            connection.disconnect();
            connection.destroy();
        }
    }
}