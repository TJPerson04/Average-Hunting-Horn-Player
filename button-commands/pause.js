// Libraries
const { getVoiceConnection } = require('@discordjs/voice');

require('dotenv').config();

module.exports = {
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guildId);

        if (connection && interaction.member.voice.channel == connection.joinConfig.channelId && connection.receiver.voiceConnection.state.subscription.player) {
            if (connection.receiver.voiceConnection.state.subscription.player.state.status != 'paused') {
                connection.receiver.voiceConnection.state.subscription.player.pause();
                return 'paused';
            } else {
                connection.receiver.voiceConnection.state.subscription.player.unpause();
                return 'unpaused';
            }

        } else if (!connection) {
            return false
        } else {
            return false
        }
    }
}