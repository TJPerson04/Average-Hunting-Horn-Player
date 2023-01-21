const { SlashCommandBuilder, Guild } = require("discord.js");
require('dotenv').config();
const index = require('../index')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle')
        .setDescription('Toggles either listening to entire songs or only a small portion - UNDER CONSTRUCTION'),
    async execute(interaction) {
        //Goes through list of guild ids to find if they have a value in zoomerMode
        //If they do, the boolean value is switched
        //If they don't, one is made
        let zoomerIndexExists = false
        let zoomerModeStatus = false
        for (let i = 0; i < index.zoomerMode.length; i++) {
            if (index.zoomerMode[i][1] == interaction.guildId) {
                index.zoomerMode[i][0] = !index.zoomerMode[i][0]
                zoomerModeStatus = index.zoomerMode[i][0]
                zoomerIndexExists = true
            }
        }

        if (!zoomerIndexExists) {
            index.zoomerMode.push([true, interaction.guildId])
            zoomerModeStatus = true
        }

        interaction.reply('Zoomer mode set to ' + zoomerModeStatus);
    }
}