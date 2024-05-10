// Libraries
const { masterQueue, queueIndexes, currentInteraction, currentMessage, client } = require('../index');
const { getInfo } = require('yt-converter');

const { GuildMember } = require('discord.js');

require('dotenv').config();


module.exports = {
    /**
     * Gets the queue for a specific server
     * If isWithMembers is true, the values in the queue are in the format [url, member]
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {boolean} isWithMembers Whether or not the queue should be returned with the member that added each song in the queue
     * @returns {Array<String>} An array of the urls of the songs in the queue
     */
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
        return queue;
    },

    // Returns an object of the user who submitted the song that is currently playing
    /**
     * Gets the member who submitted the song that is currently playing
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {GuildMember}
     */
    async getCurrentSongOwner(guildId) {
        let queue = module.exports.getQueue(guildId, true);
        let queueIndex = module.exports.getQueueIndex(guildId);
        let memberId = queue[queueIndex][1];
        let guild = await client.guilds.fetch(guildId);
        let member = await guild.members.fetch(memberId);

        return member;
    },

    /**
     * Gets whether or not a queue exists for a given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {boolean}
     */
    isQueueHere(guildId) {
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                return true
            }
        }
        return false
    },

    /**
     * Gets the index of the currently playing song in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {Number}
     */
    getQueueIndex(guildId) {
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                return queueIndexes[i][0];
            }
        }

        return 0;
    },

    /**
     * Gets the index of the interaction that represents the display message in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {Number|null}
     */
    getCurrentInteractionIndex(guildId) {
        for (let i = 0; i < currentInteraction.length; i++) {
            if (currentInteraction[i][0] == guildId) {
                return i;
            }
        }

        return null;
    },

    /**
     * Gets the index of the message that represents the display message in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {Number|null}
     */
    getCurrentMessageIndex(guildId) {
        for (let i = 0; i < currentMessage.length; i++) {
            if (currentMessage[i][0] == guildId) {
                return i;
            }
        }

        return null;
    },

    /**
     * Changes the index for the currently playing song for the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {Number} newIndex 
     * @returns {Number} The new index
     */
    changeQueueIndex(guildId, newIndex) {
        for (let i = 0; i < queueIndexes.length; i++) {
            if (queueIndexes[i][1] == guildId) {
                queueIndexes[i][0] = newIndex;
                return queueIndexes[i][0];
            }
        }

        return 0;
    },

    /**
     * Gets the title of the given Youtube video
     * @param {String} url The url of the video
     * @returns {String} The title of the video
     */
    async getYTTitle(url) {
        let info = await getInfo(url);
        return info.title;
    },

    /**
     * Gets relevant information about the source of the given url
     * @param {String} url The url of the video/song
     * @returns {[String, String, String]} [The site ("YT" or "spotify"), The type of url ("song" or "playlist"), The id]
     */
    async getUrlType(url) {
        let [site, type, id] = [null, null, null];

        if (url.includes('youtube') || url.includes('youtu.be')) {
            site = 'YT';

            if (url.includes('v=')) {
                type = 'song';
                id = url.split('v=')[1];
                if (id.includes('&')) {
                    id = id.split('&')[0];
                }
            } else if (url.includes('list')) {
                type = 'playlist';
                id = url.split('list=')[1];
            } else if (url.includes('si=')) {
                type = 'song';
                id = url.split('youtu.be/')[1];
                id = id.split('?')[0];
            } else {
                type = null;
                id = null;
            }

        } else if (url.includes('spotify')) {
            site = 'spotify';

            if (url.includes('track')) {
                type = 'song';
                id = url.split('track/')[1];
                if (id.includes('?')) {
                    id = id.split('?')[0];
                }
            } else if (url.includes('playlist')) {
                type = 'playlist';
                id = url.split('playlist/')[1];
                if (id.includes('?')) {
                    id = id.split('?')[0];
                }
            } else if (url.includes('album')) {
                type = 'playlist';
                id = url.split('album/')[1];
                if (id.includes('?')) {
                    id.split('?')[0];
                }
            }
        }

        return [site, type, id];
    }
}