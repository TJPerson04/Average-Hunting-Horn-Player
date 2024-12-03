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
     * @param {Boolean} isWithMembers Whether or not the returned queue should include the member id
     * @returns {Array<String>} An array of the urls of the songs in the queue
     */
    getQueue(guildId, isWithMembers = false) {
        // if (!isWithMembers) {
        //     queue = masterQueue[guildId];
        //     for (let i = 0; i < queue.length; i++) {
        //         queue[i] = queue[i].url;
        //     }
        //     return queue;
        // }
        return masterQueue[guildId];
    },

    /**
     * Adds the given entry to the master queue
     * @param {String} guildId The id of the server
     * @param {String} url The url of the song
     * @param {String} memberId The id of the member who added the song
     * @param {null} [index=null] The index in the queue to put it (if none is given it is added at the end of the queue)
     */
    addToMasterQueue(guildId, url, memberId, index = null) {
        if (masterQueue[guildId]) {
            if (!index) {
                masterQueue[guildId].push({
                    url: url, 
                    memberId: memberId
            });
            } else {
                masterQueue[guildId].splice(index, 0, {url: url, memberId: memberId});
            }
        } else {
            masterQueue[guildId] = [{
                url: url, 
                memberId: memberId
            }]
            console.log('In addToMasterQueue: ' + masterQueue[guildId][0].memberId);
        }
    },

    removeFromMasterQueue(guildId) {
        if (masterQueue[guildId]) {
            masterQueue[guildId] = []
            queueIndexes[guildId] = 0;
        }
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
        // console.log(queue);
        // console.log(queueIndex);
        let memberId = queue[queueIndex].memberId;
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
        return !!queueIndexes[guildId];
    },

    /**
     * Gets the index of the currently playing song in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {Number}
     */
    getQueueIndex(guildId) {
        return queueIndexes[guildId];
    },

    /**
     * Gets the index of the interaction that represents the display message in the given server
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {Number|null}
     */
    getCurrentInteractionIndex(guildId) {
        for (let i = 0; i < currentInteraction.length; i++) {
            if (currentInteraction[i] && currentInteraction[i][0] == guildId) {
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
            if (currentMessage[i] && currentMessage[i][0] == guildId) {
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
        queueIndexes[guildId] = newIndex;
        return 0;
    },

    /**
     * Gets the title of the given Youtube video
     * @param {String} url The url of the video
     * @returns {Promise<String>} The title of the video
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