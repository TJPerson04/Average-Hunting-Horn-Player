const { SlashCommandBuilder, Guild } = require("discord.js");
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips currently playing song'),
    async execute(interaction) {
        const { getVoiceConnection, createAudioResource } = require('@discordjs/voice');

        const connection = getVoiceConnection(interaction.guildId);

        if (connection && interaction.member.voice.channel == connection.joinConfig.channelId && connection.receiver.voiceConnection.state.subscription.player) {
            connection.receiver.voiceConnection.state.subscription.player.play(createAudioResource(__dirname + '\\..\\portal_radio.mp3')) //Prevents song.mp3 from being busy, allowwing it to be deleted
            connection.receiver.voiceConnection.state.subscription.player.stop();
            await interaction.reply('Skipped video');
        } else if (!connection) {
            await interaction.reply('There is nothing to skip');
        } else {
            await interaction.reply('You must be in the voice channel to use this command');
        }
    }
}