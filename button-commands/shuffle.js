// Libraries
const { masterQueue } = require("../index");
const { getQueue, getQueueIndex, addToMasterQueue, removeFromMasterQueue } = require("../helpers/helper_functions");

require('dotenv').config();


module.exports = {
    async execute(interaction) {
        let queue = getQueue(interaction.guildId, true);
        let queueIndex = getQueueIndex(interaction.guildId);

        //Removes queue from masterQueue
        removeFromMasterQueue(interaction.guildId);

        //Makes sure that the currently playing song is still at the front of the queue, then doesn't repeat
        for (let i = 0; i <= queueIndex; i++) {
            addToMasterQueue(interaction.guildId, queue[i].url, queue[i].memberId);
        }
        queue.splice(0, queueIndex);

        this.shuffle(queue);

        for (let i = 0; i < queue.length; i++) {
            addToMasterQueue(interaction.guildId, queue[i].url, queue[i].memberId);
        }

        //Equality Part
        queue = getQueue(interaction.guildId, true);

        //Removes queue from masterQueue
        removeFromMasterQueue(interaction.guildId);

        let people = []
        for (let i = 0; i < queue.length; i++) {
            if (!people.includes(queue[i].memberId)) {
                people.push(queue[i].memberId)
            }
        }

        let diffQueues = []
        for (let i = 0; i < people.length; i++) {
            let output = []
            for (let j = 0; j < queue.length; j++) {
                if (queue[j].memberId == people[i]) {
                    output.push(queue[j])
                }
            }
            diffQueues.push(output);
        }

        let newQueue = []
        // console.log(queue.length)
        for (let i = 0; i < queue.length; i++) {
            for (let j = 0; j < diffQueues.length; j++) {
                if (diffQueues[j][i]) {
                    newQueue.push(diffQueues[j][i])
                }
            }
        }

        for (let i = 0; i < newQueue.length; i++) {
            addToMasterQueue(interaction.guildId, newQueue[i].url, newQueue[i].memberId);
        }

        console.log('Spread queue between ' + people.length + ' people');

        return true;
    },
    shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}