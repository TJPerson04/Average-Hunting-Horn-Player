const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice'); const { SlashCommandBuilder, Guild } = require("discord.js");
require('dotenv').config();
const index = require('../index');
const { join } = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dnd')
        .setDescription('Plays music for D&D -- UNDER CONSTRUCTION')
        .addStringOption(option =>
            option
                .setName('song')
                .setDescription('The song to play')
                .setRequired(true)),
    execute: async (interaction) => {
        const song = interaction.options.getString('song');
        const textChannel = interaction.channel;
        let filePath;

        let voiceChannelId;
        if (interaction.member.voice.channel) {
            voiceChannelId = interaction.member.voice.channel.id;
        } else {
            await interaction.reply('You must be in a voice channel to use this command');
            return
        }

        switch (song) {
            case 'panic':
                filePath = join(__dirname, '\\..\\dnd\\LobotomyCorporation_OST_Second_Warning.mp3');
                break;
            case 'church':
                filePath = join(__dirname, '\\..\\dnd\\Arknights_OST_bat_white_trans.mp3');
                break;
            case '2':
                filePath = join(__dirname, '\\..\\dnd\\Arknights_OST_bat_act17side_01.mp3')
                break;
        }

        if (!filePath) {
            interaction.reply('Unkown song');
            return
        }

        let connection;
        if (getVoiceConnection(interaction.guildId)) {
            connection = getVoiceConnection(interaction.guildId);
        } else {
            connection = joinVoiceChannel({
                channelId: voiceChannelId,
                guildId: textChannel.guild.id,
                adapterCreator: textChannel.guild.voiceAdapterCreator,
            })
        }
        const player = createAudioPlayer();
        const resource = createAudioResource(filePath);

        connection.subscribe(player);
        player.play(resource);

        //I have absolutely no clue what this bit of code does, stole it off the internet and it fixed a bug
        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        }

        connection.on('stateChange', (oldState, newState) => {
            const oldNetworking = Reflect.get(oldState, 'networking');
            const newNetworking = Reflect.get(newState, 'networking');

            oldNetworking?.off('stateChange', networkStateChangeHandler);
            newNetworking?.on('stateChange', networkStateChangeHandler);
        });

        interaction.reply('Playing song');
    }
}