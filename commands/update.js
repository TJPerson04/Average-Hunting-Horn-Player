const { SlashCommandBuilder, Guild } = require("discord.js");
const { currentMessage, currentInteraction } = require('../index');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Moves the currently playing display to the front of the channel'),
    async execute(interaction) {
        let content = currentMessage[0].reactions.message.content;
        let row = currentMessage[0].reactions.message.components

        let newMessage = await interaction.deferReply({ fetchReply: true });
        await interaction.editReply({
            content: content,
            components: row
        });

        currentMessage[0] = newMessage
        currentInteraction[0] = interaction
    }
}