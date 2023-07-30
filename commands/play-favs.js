const { SlashCommandBuilder, Guild } = require("discord.js");
const fs = require('fs');
const { join } = require('node:path');
const { addYTPlaylist, addSpotifyPlaylist, isQueueHere } = require("../helpers/helper_functions");
const shuffle = require('./shuffle');
const equality = require('./equality');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { queueIndexes, currentInteraction, currentMessage } = require('../index');

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-favs')
        .setDescription('Plays the playlists of everyone in a vc - UNDER CONSTRUCTION'),
    async execute(interaction) {
        if (!isQueueHere(interaction.guildId)) {
            queueIndexes.push([0, interaction.guildId]);
        }

        db = JSON.parse(fs.readFileSync(join(__dirname, '\\..\\favs.json')));
        
        let message = await interaction.deferReply({ fetchReply: true });
        currentMessage.push(message);


        let users = []
        for (var entry of interaction.member.voice.channel.members.entries()) {
            users.push(entry[0])
        }

        let connection;
        if (getVoiceConnection(interaction.guildId)) {
            connection = getVoiceConnection(interaction.guildId);
        } else {
            connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.channel.guild.id,
                adapterCreator: interaction.channel.guild.voiceAdapterCreator,
            })
        }

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

        currentInteraction.push(interaction);
        for (let i = 0; i < db.lists.length; i++) {
            if (users.includes(db.lists[i][0])) {
                if (db.lists[i][1].includes('youtube')) {
                    await addYTPlaylist(interaction.guild.id, db.lists[i][0], db.lists[i][1])
                } else if (db.lists[i][1].includes('spotify')) {
                    await addSpotifyPlaylist(interaction.guild.id, db.lists[i][0], db.lists[i][1])
                }
            }
        }

        

        shuffle.execute(interaction);
        equality.execute(interaction);
    }
}