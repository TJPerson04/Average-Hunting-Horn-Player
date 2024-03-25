// Libraries
const { masterQueue } = require("../index");
const { getQueue, getQueueIndex } = require("../helpers/helper_functions");

require('dotenv').config();


module.exports = {
    async execute(interaction) {
        let queue = getQueue(interaction.guildId, true);
        let queueIndex = getQueueIndex(interaction.guildId);

        //Removes queue from masterQueue
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == interaction.guildId) {
                masterQueue.splice(i, 1);
                i = -1; //So that it will increment to 0 for the next run
            }
        }

        //Makes sure that the currently playing song is still at the front of the queue, then doesn't repeat
        for (let i = 0; i <= queueIndex; i++) {
            masterQueue.push([interaction.guildId, queue[i][0], queue[i][1]])
        }
        queue.splice(0, queueIndex)

        this.shuffle(queue);

        for (let i = 0; i < queue.length; i++) {
            masterQueue.push([interaction.guildId, queue[i][0], queue[i][1]])
        }

        //Equality Part
        queue = getQueue(interaction.guildId, true);

        //Removes queue from masterQueue
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == interaction.guildId) {
                masterQueue.splice(i, 1);
                i = -1; //So that it will increment to 0 for the next run
            }
        }

        let people = []
        for (let i = 0; i < queue.length; i++) {
            if (!people.includes(queue[i][1])) {
                people.push(queue[i][1])
            }
        }

        let diffQueues = []
        for (let i = 0; i < people.length; i++) {
            let output = []
            for (let j = 0; j < queue.length; j++) {
                if (queue[j][1] == people[i]) {
                    output.push(queue[j])
                }
            }
            diffQueues.push(output);
        }

        let newQueue = []
        console.log(queue.length)
        for (let i = 0; i < queue.length; i++) {
            for (let j = 0; j < diffQueues.length; j++) {
                if (diffQueues[j][i]) {
                    newQueue.push(diffQueues[j][i])
                }
            }
        }

        for (let i = 0; i < newQueue.length; i++) {
            masterQueue.push([interaction.guildId, newQueue[i][0], newQueue[i][1]])
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