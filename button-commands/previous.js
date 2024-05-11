// Libraries
const { queueIndexes } = require('../index');

require('dotenv').config();


module.exports = {
    async execute(interaction) {
        const { getVoiceConnection, createAudioResource } = require('@discordjs/voice');

        const connection = getVoiceConnection(interaction.guildId);

        if (connection && interaction.member.voice.channel == connection.joinConfig.channelId && connection.receiver.voiceConnection.state.subscription.player) {
            queueIndexes[interaction.guildId] -= 2
            if (queueIndexes[interaction.guildId] < -1) {
                queueIndexes[interaction.guildId] = -1
            }
            connection.receiver.voiceConnection.state.subscription.player.play(createAudioResource(__dirname + '/../portal_radio.mp3')) //Prevents song.mp3 from being busy, allowwing it to be deleted
            connection.receiver.voiceConnection.state.subscription.player.stop();
            return true
        } else if (!connection) {
            return false
        }
    }
}