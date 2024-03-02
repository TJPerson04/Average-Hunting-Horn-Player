// Libraries
const skip = require('../button-commands/skip');
const stop = require('../button-commands/stop');
const pause = require('../button-commands/pause');
const prev = require('../button-commands/previous');
const shuffle = require('../button-commands/shuffle');
const { changePauseButton } = require('../helpers/display');

const { Events } = require('discord.js');


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
            }
        } else if (interaction.isButton()) {
            interaction.update(interaction.fetchReply()); //This is just so that the interaction doesn't time out
            
            if (interaction.customId == 'skip') {
                skip.execute(interaction);
            } else if (interaction.customId == 'stop') {
                stop.execute(interaction);
            } else if (interaction.customId == 'pause') {
                const result = await pause.execute(interaction);
                await changePauseButton(result, interaction.guild.id);  // This sometimes doesn't work, not sure why
            } else if (interaction.customId == 'prev') {
                prev.execute(interaction);
            } else if (interaction.customId == 'shuffle') {
                shuffle.execute(interaction);
            }
        }
    }
}