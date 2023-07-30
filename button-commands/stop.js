const { SlashCommandBuilder, Guild } = require("discord.js");
const { createAudioResource } = require('@discordjs/voice')
const { masterQueue } = require('../index');
const fs = require('fs');
require('dotenv').config();
const index = require('../index');
const { join } = require('node:path');

module.exports = {
    async execute(interaction) {
        const { getVoiceConnection } = require('@discordjs/voice');

        const connection = getVoiceConnection(interaction.guildId);

        //Removes queue from masterQueue
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == interaction.guildId) {
                masterQueue.splice(i, 1);
                i = 0;
            }
        }

        //Stops inspirobot voice
        for (let i = 0; i < index.isInspirationPlaying.length; i++) {
            if (index.isInspirationPlaying[i][1] == interaction.guildId) {
                index.isInspirationPlaying[i][0] = false
            }
        }

        if (connection) {
            //console.log(connection.receiver.voiceConnection.state.subscription.player)
            //connection.destroy();
            if (connection.receiver.voiceConnection.state.subscription) {
                connection.receiver.voiceConnection.state.subscription.player.play(createAudioResource(join(__dirname, '\\..\\portal_radio.mp3')))
                connection.receiver.voiceConnection.state.subscription.player.stop();    
            }
            connection.receiver.voiceConnection.disconnect();
            connection.receiver.voiceConnection.destroy();
            return true
        } else {
            return false
        }

        //Removes queue from masterQueue
        for (let i = 0; i < masterQueue.length; i++) {
            if (masterQueue[i][0] == interaction.guildId) {
                masterQueue.splice(i, 1);
                i = 0;
            }
        }

        /*//Deletes any files in files folder
        let files = fs.readdirSync(__dirname + '\\..\\files', (err) => {
            if (err) {
                console.error(err)
            }
        })

        for (let i = 0; i < files.length; i++) {
            fs.unlink(__dirname + '\\..\\files\\' + files[i], (err) => {
                if (err) {
                    console.error(err)
                }
            })
        }*/
    }
}