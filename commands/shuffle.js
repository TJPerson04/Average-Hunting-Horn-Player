// Libraries
const shuffle = require("../button-commands/shuffle");

const { SlashCommandBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffles the current queue'),
    async execute(interaction) {
        if (shuffle.execute(interaction)) {
            await interaction.reply("Successfully shuffled the queue");
            setTimeout(() => {
                interaction.deleteReply();
            }, 5000);
        } else {
            interaction.reply("There was an error shuffling the queue");
        }
    }
}