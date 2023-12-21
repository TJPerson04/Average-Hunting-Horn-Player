const { masterQueue, queueIndexes, isLooping, currentInteraction, currentMessage, client } = require('../index');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ClientUser, Client } = require('discord.js');
const ytConverter = require('yt-converter');
const fs = require('fs');
const { join } = require('node:path');
const PlaylistSummary = require('youtube-playlist-summary')
const Spotify = require('spotifydl-core').default
const spotifyCredentials = {
    clientId: process.env.spotifyClientId,
    clientSecret: process.env.spotifyClientSecret
}
const spotify = new Spotify(spotifyCredentials);

require('dotenv').config();


module.exports = {
    async manageDisplay(url, guildId, videoTitle, thumbnailUrl) {
        const prevButton = new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji('<:previous_trans:1132482554570735657>')
            .setStyle(ButtonStyle.Primary)

        const shuffleButton = new ButtonBuilder()
            .setCustomId('shuffle')
            .setEmoji('<:shuffle:1132485858537254984>')
            .setStyle(ButtonStyle.Primary)

        const stopButton = new ButtonBuilder()
            .setCustomId('stop')
            .setEmoji('<:trans_stop:1132480218343424020>')
            .setStyle(ButtonStyle.Danger);

        const pauseButton = new ButtonBuilder()
            .setCustomId('pause')
            .setEmoji('<:pause_trans:1132482406453092482>')
            .setStyle(ButtonStyle.Secondary)

        const skipButton = new ButtonBuilder()
            .setCustomId('skip')
            .setEmoji('<:next_trans:1132482765015748689>')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(prevButton, shuffleButton, stopButton, pauseButton, skipButton);

        //Gets user's name to display who added the current song
        let queue = this.getQueue(guildId, true);
        let queueIndex = this.getQueueIndex(guildId);
        console.log(queueIndex);
        let memberId = queue[queueIndex][1];
        let guild = await client.guilds.fetch(guildId);
        let member = await guild.members.fetch(memberId);

        let currentInteractionIndex = module.exports.getCurrentInteractionIndex(guildId);
        let currentMessageIndex = module.exports.getCurrentMessageIndex(guildId);

        if (currentMessageIndex == null) {
            console.log(currentMessage);
            return
        }

        // The message to be sent
        let outputMessage = {
            "content": "",
            "components": [row],
            "tts": false,
            "embeds": [
                {
                    "type": "rich",
                    "title": `${videoTitle}`,
                    "description": "",
                    "color": 0xffe897,
                    "thumbnail": {
                        "url": `${thumbnailUrl}`,
                        "height": 0,
                        "width": 0
                    },
                    "author": {
                        "name": `Currently Playing `
                    },
                    "footer": {
                        "text": `Added by ${member.nickname ? member.nickname : member.user.globalName}`,  // If the user has a nickname in this server, use that. Otherwise, just use their username
                        "icon_url": `${member.avatarURL() ? member.avatarURL() : member.user.displayAvatarURL()}`  // If the user has a server specific avatar, display that. Otherwise, just use their global avatar
                    },
                    "url": `${url}`
                }
            ]
        }

        //This is a little weird but edits the interaction if it 
        //can (so that it isn't constantly defered), 
        //and edits the message if it can't (after 15 minutes)
        let response;
        try {
            response = await currentInteraction[currentInteractionIndex][1].editReply(outputMessage)
        } catch (err) {
            response = await currentMessage[currentMessageIndex][1].edit(outputMessage);
        }

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000
        });

        collector.on('collect', async i => {
            const selection = i.values[0];
            await i.reply(`${i.user} has selected ${selection}!`);
        })
    },

    async displayDownloadPercent(perc, guildId, url) {
        let currentInteractionIndex = module.exports.getCurrentInteractionIndex(guildId);
        let currentMessageIndex = module.exports.getCurrentMessageIndex(guildId);

        if (currentMessageIndex == null) {
            console.log(currentMessage);
            return
        }

        //This is a little weird but edits the interaction if it 
        //can (so that it isn't constantly defered), 
        //and edits the message if it can't (after 15 minutes)
        let response;
        percFormatted = Math.round(perc).toString();
        try {
            response = await currentInteraction[currentInteractionIndex][1].editReply({
                content: `Loading ${url}\n${percFormatted}%`
            })
        } catch (err) {
            response = await currentMessage[currentMessageIndex][1].edit({
                content: `Loading ${url}\n${percFormatted}%`
            });
        }
    },

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
        let test = player;

        //Removes old song if there
        try {
            //fs.unlinkSync(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
        } catch (err) {
            console.log('AN ERROR OCCURED')
            console.error(err)
        }
        console.log('1 - ' + url)

        //Downloads youtube url as mp3, then turns that into an audio resource that works w/ connection
        try {
            ytConverter.convertAudio({
                url: url,
                directoryDownload: __dirname + '\\..\\files\\songs',
                itag: 140
            }, (perc) => {
                console.log(perc)
                module.exports.displayDownloadPercent(perc, guildId, url)
            }, async () => {
                console.log('1.5 - ' + url)
                await ytConverter.getInfo(url).then(async info => {
                    console.log('2 - ' + url)
                    console.log(info)
                    let titleOrig = info.title;
                    //Downloaded files can't handle colons, so this removes them
                    title = titleOrig.replaceAll(':', '').replaceAll('|', '').replaceAll(',', '').replaceAll('\\', '').replaceAll('/', '').replaceAll('?', '').replaceAll('"', '').replaceAll('*', '');

                    //Makes sure that if the skip/previous button is spammed, only the correct song actually plays
                    //Doesn't really work that well tbh (It said "this.getQueue is not a function")
                    let queue = module.exports.getQueue(guildId, false);
                    let currentUrl = queue[module.exports.getQueueIndex(guildId)];

                    console.log('3 - ' + url)
                    try {
                        if (url == currentUrl) {
                            console.log('test1')
                            fs.renameSync(join(__dirname, '\\..\\files\\songs\\', title) + '.mp3', join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'));
                            console.log('test2')
                        } else {
                            console.log('test3')
                            fs.unlinkSync(join(__dirname, '\\..\\files\\songs\\', title) + '.mp3');
                            console.log('test4')
                        }
                    } catch (err) {
                        console.log('Problem is here ig - 1')
                        console.error(err)
                    }

                    console.log('4 - ' + url)


                    let resource;
                    try {
                        resource = createAudioResource(join(__dirname, '\\..\\files\\songs\\song_' + guildId + '.mp3'))
                    } catch {
                        console.log('Problem here ig - 2')
                    }

                    connection.subscribe(player);
                    player.play(resource);
                    player.addListener('stateChange', async (oldOne, newOne) => {
                        if (newOne.status == "idle") {
                            module.exports.playNextSong(guildId);
                        }
                    })

                    let thumbnailUrl = info.thumbnails[4].url

                    module.exports.manageDisplay(url, guildId, titleOrig, thumbnailUrl);
                });
            })
        } catch {
            console.log('Let me cry')
            this.playYTVideo(guildId, url)
        }



        console.log(url)
        console.log(player);
        return player;
    },

    async playSpotifySong(guildId, url) {
        console.log('wut')
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
        queue = module.exports.getQueue(guildId, false);
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
                console.log('Reched the end of the queue');
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

    async addYTPlaylist(guildId, userId, url) {
        const config = {
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, // require
            PLAYLIST_ITEM_KEY: ['videoUrl'], // option
        }

        const ps = new PlaylistSummary(config)
        const PLAY_LIST_ID = url.split('list=')[1] //Gets the id from the url

        await ps.getPlaylistItems(PLAY_LIST_ID)
            .then(async (result) => {
                queue = module.exports.getQueue(guildId, false)

                if (queue.length == 0) {
                    await module.exports.playYTVideo(guildId, result.items[0].videoUrl);
                    //await interaction.reply(`Playing ${url}`);
                } else {
                    //await interaction.reply('Added to the queue');
                }

                for (let i = 0; i < result.items.length; i++) {
                    masterQueue.push([guildId, result.items[i].videoUrl, userId]);
                }
            })
            .catch((error) => {
                console.error(error)
            })
    },

    async addSpotifyPlaylist(guildId, userId, url) {
        await spotify.getPlaylist(url).then(async (result) => {
            queue = module.exports.getQueue(guildId, false)
            let tracks = result.tracks;

            if (queue.length == 0) {
                module.exports.playSpotifySong(guildId, 'https://open.spotify.com/track/' + tracks[0]);
                //await interaction.reply(`Playing ${url}`);
            } else {
                //await interaction.reply('Added to the queue');
            }

            for (let i = 0; i < tracks.length; i++) {
                masterQueue.push([guildId, 'https://open.spotify.com/track/' + tracks[i], userId])
            }
        })
            .catch((error) => {
                console.error(error)
            })
    },

    //
    isQueueHere(guildId) {
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                return true
            }
        }
        return false
    },

    getQueueIndex(guildId) {
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                return queueIndexes[i][0];
            }
        }

        return 0;
    },

    getCurrentInteractionIndex(guildId) {
        for (let i = 0; i < currentInteraction.length; i++) {
            if (currentInteraction[i][0] == guildId) {
                return i;
            }
        }

        return null;
    },

    getCurrentMessageIndex(guildId) {
        for (let i = 0; i < currentMessage.length; i++) {
            if (currentMessage[i][0] == guildId) {
                return i;
            }
        }

        return null;
    },

    changeQueueIndex(guildId, newIndex) {
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                queueIndexes[i][0] = newIndex;
                return queueIndexes[i][0];
            }
        }

        return 0;
    }
}