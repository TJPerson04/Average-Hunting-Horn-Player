// Libraries
const { masterQueue, queueIndexes, isLooping, currentInteraction, currentMessage, client } = require('../index');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ClientUser, Client } = require('discord.js');


require('dotenv').config();


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
        return queue;
    },

    // Returns an object of the user who submitted the song that is currently playing
    async getCurrentSongOwner(guildId) {
        let queue = module.exports.getQueue(guildId, true);
        let queueIndex = module.exports.getQueueIndex(guildId);
        let memberId = queue[queueIndex][1];
        let guild = await client.guilds.fetch(guildId);
        let member = await guild.members.fetch(memberId);

        return member;
    },

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