// Libraries
const { masterQueue, isInspirationPlaying, currentInteraction, currentMessage } = require('../index');
const { getCurrentMessageIndex, getCurrentInteractionIndex, removeFromMasterQueue } = require("../helpers/helper_functions");

const { createAudioResource, getVoiceConnection } = require('@discordjs/voice')
const { join } = require('node:path');

require('dotenv').config();


module.exports = {
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guildId);

        //Removes queue from masterQueue
        removeFromMasterQueue(interaction.guildId);

        //Removes current message & current index
        let currentMessageIndex = getCurrentMessageIndex(interaction.guildId);
        let currentInteractionIndex = getCurrentInteractionIndex(interaction.guildId);

        currentMessage.splice(currentMessageIndex, 1);
        currentInteraction.splice(currentInteractionIndex, 1);


        //Stops inspirobot voice
        for (let i = 0; i < isInspirationPlaying.length; i++) {
            if (isInspirationPlaying[i][1] == interaction.guildId) {
                isInspirationPlaying[i][0] = false
            }
        }

        if (connection) {
            //console.log(connection.receiver.voiceConnection.state.subscription.player)
            //connection.destroy();
            if (connection.receiver.voiceConnection.state.subscription) {
                connection.receiver.voiceConnection.state.subscription.player.play(createAudioResource(join(__dirname, '/../portal_radio.mp3')))
                connection.receiver.voiceConnection.state.subscription.player.stop();    
            }
            connection.receiver.voiceConnection.disconnect();
            connection.receiver.voiceConnection.destroy();
            return true
        } else {
            return false
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