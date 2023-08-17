const { SlashCommandBuilder, Guild } = require("discord.js");
const { currentMessage, currentInteraction } = require('../index');
const { getCurrentInteractionIndex, getCurrentMessageIndex } = require('../helpers/helper_functions');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Moves the currently playing display to the front of the channel'),
    async execute(interaction) {
        let currentInteractionIndex = getCurrentInteractionIndex(interaction.guildId);
        let currentMessageIndex = getCurrentMessageIndex(interaction.guildId);

        if (!currentInteractionIndex || !currentMessageIndex) {
            interaction.reply('No message to update');
            return
        }

        let content = currentMessage[currentInteractionIndex].reactions.message.content;
        let row = currentMessage[currentInteractionIndex].reactions.message.components;

        let newMessage = await interaction.deferReply({ fetchReply: true });
        await interaction.editReply({
            content: content,
            components: row
        });

        currentInteraction[currentInteractionIndex][1] = interaction
        currentMessage[currentMessageIndex][1] = newMessage
    }
}
//TEST