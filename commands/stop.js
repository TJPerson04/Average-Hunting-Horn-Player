// Libraries
const stop = require('../button-commands/stop');

const { SlashCommandBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the bot and empties the queue'),
    async execute(interaction) {
        if (stop.execute(interaction)) {
            await interaction.reply("Bot successfully stopped");
            setTimeout(() => {
                interaction.deleteReply();
            }, 5000);
        } else {
            await interaction.reply("There was an error stopping the bot");
        }
    }
}