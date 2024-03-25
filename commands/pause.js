// Libraries
const pause = require("../button-commands/pause");

const { SlashCommandBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses/unpauses whatever is playing'),
    async execute(interaction) {
        let result = await pause.execute(interaction)
        if (result) {
            await interaction.reply("Successfully " + result + " the song");
            setTimeout(() => {
                interaction.deleteReply();
            }, 5000);
        } else {
            interaction.reply("There was an error pausing/unpausing the song");
        }
    }
}