const { SlashCommandBuilder, Guild } = require("discord.js");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses/unpauses whatever is playing'),
    async execute(interaction) {
        const { getVoiceConnection, createAudioResource } = require('@discordjs/voice');

        const connection = getVoiceConnection(interaction.guildId);

        if (connection && interaction.member.voice.channel == connection.joinConfig.channelId && connection.receiver.voiceConnection.state.subscription.player) {
            if (connection.receiver.voiceConnection.state.subscription.player.state.status != 'paused') {
                connection.receiver.voiceConnection.state.subscription.player.pause();
                await interaction.reply('Paused video');
            } else {
                connection.receiver.voiceConnection.state.subscription.player.unpause();
                await interaction.reply('Unpaused video');
            }

        } else if (!connection) {
            await interaction.reply('There is nothing to pause');
        } else {
            await interaction.reply('You must be in the voice channel to use this command');
        }
    }
}