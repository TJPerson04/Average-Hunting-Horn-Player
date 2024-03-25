// Libraries
const skip = require('../button-commands/skip');

const { SlashCommandBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips currently playing song'),
    async execute(interaction) {
        if (skip.execute(interaction)) {
            await interaction.reply("Song successfully skipped");
            setTimeout(() => {
                interaction.deleteReply();
            }, 5000);
        } else {
            interaction.reply("There was an error skipping the song");
        }
    }
}