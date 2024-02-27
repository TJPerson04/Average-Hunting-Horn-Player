// Libraries
const { masterQueue, queueIndexes, currentInteraction, currentMessage, client } = require('../index');

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
    }
}