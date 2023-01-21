const { SlashCommandBuilder, Guild } = require("discord.js");
const fs = require('fs');
const { masterQueue } = require("..");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffles the current queue'),
    async execute(interaction) {
        let queue = this.getQueue(interaction.guildId);

        //Removes queue from masterQueue
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == interaction.guildId) {
                masterQueue.splice(i, 1);
                i = -1; //So that it will increment to 0 for the next run
            }
        }
        
        //Makes sure that the currently playing song is still at the front of the queue, then doesn't repeat
        masterQueue.push([interaction.guildId, queue[0][0], queue[0][1]])
        queue.splice(0, 1)

        this.shuffle(queue);
        
        for (let i = 0; i < queue.length; i++) {
            masterQueue.push([interaction.guildId, queue[i][0], queue[i][1]])
        }

        await interaction.reply('Queue shuffled')
    },
    //Changed slightly, now returns queue w/ members
    getQueue(guildId) {
        let queue = []
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == guildId) {
                queue.push([masterQueue[i][1], masterQueue[i][2]]);
            }
        }
        return queue
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