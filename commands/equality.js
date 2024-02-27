// Libraries
const { getQueue } = require("../helpers/helper_functions");

const { SlashCommandBuilder } = require("discord.js");
const { masterQueue } = require("..");

require('dotenv').config();


module.exports = {
    data: new SlashCommandBuilder()
        .setName('equality')
        .setDescription('Rearranges the queue to alternate between music played by different people'),
    async execute(interaction) {
        let queue = getQueue(interaction.guildId, true);

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
        //await interaction.reply('Equality has been reached');  //Commented bc play-favs
    }
}