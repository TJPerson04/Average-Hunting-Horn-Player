const { SlashCommandBuilder, Guild } = require("discord.js");
const { isLooping } = require('../index');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Loops the queue'),
    async execute(interaction) {
        for (let i = 0; i < isLooping.length; i++) {
            if (isLooping[i][1] == interaction.guildId) {
                isLooping[i][0] = !isLooping[i][0];
                interaction.reply('Looping set to ' + isLooping[i][0]);
                return;
            }
        }

        isLooping.push([true, interaction.guildId]);
        interaction.reply('Looping set to true');
        return;
    }
}