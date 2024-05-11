// Libraries
const { isQueueHere, getCurrentInteractionIndex, getCurrentMessageIndex, changeQueueIndex } = require("../helpers/helper_functions");
const { addYTPlaylist, addSpotifyPlaylist } = require('../helpers/song_playing');
const { queueIndexes, currentInteraction, currentMessage } = require('../index');
const shuffle = require('../button-commands/shuffle');
const equality = require('./equality');

const { SlashCommandBuilder } = require("discord.js");
const fs = require('fs');
const { join } = require('node:path');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

require('dotenv').config();


module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-favs')
        .setDescription('Plays the playlists of everyone in a vc'),
    async execute(interaction) {
        if (!isQueueHere(interaction.guildId)) {
            queueIndexes[interaction.guildId] = 0;
        } else {
            if (getQueue(interaction.guildId).length == 0) {
                changeQueueIndex(interaction.guildId, 0);
            }
        }

        db = JSON.parse(fs.readFileSync(join(__dirname, '/../favs.json')));
        
        let message = await interaction.deferReply({ fetchReply: true });

        //Checks if server has current interaction/message
        //If so, updates not, otherwise adds one
        let currentInteractionIndex = getCurrentInteractionIndex(interaction.guildId);
        let currentMessageIndex = getCurrentMessageIndex(interaction.guildId);

        currentInteractionIndex ? currentInteraction[currentInteractionIndex][1] = interaction : currentInteraction.push([interaction.guildId, interaction]);
        currentMessageIndex ? currentMessage[currentMessageIndex][1] = message : currentMessage.push([interaction.guildId, message]);


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