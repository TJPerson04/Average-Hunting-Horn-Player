// Libraries
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { currentInteraction, currentMessage } = require('../index');
const { getQueue, getQueueIndex, getCurrentInteractionIndex, getCurrentMessageIndex, getCurrentSongOwner } = require('./helper_functions');

// Constants
PREVIOUS_BUTTON_EMOJI = '<:previous_trans:1132482554570735657>';
SHUFFLE_BUTTON_EMOJI = '<:shuffle:1132485858537254984>';
STOP_BUTTON_EMOJI = '<:trans_stop:1132480218343424020>';
PAUSE_BUTTON_EMOJI = '<:pause_trans:1132482406453092482>';
PLAY_BUTTON_EMOJI = '<:play:1124382171633819758>';
SKIP_BUTTON_EMOJI = '<:next_trans:1132482765015748689>';

// Actual functions
module.exports = {
    // Returns the row object including all the buttons
    async createTheButtons(isPaused) {
        let pauseEmoji = PAUSE_BUTTON_EMOJI;
        if (isPaused) {
            pauseEmoji = PLAY_BUTTON_EMOJI;
        }

        const prevButton = new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji(PREVIOUS_BUTTON_EMOJI)
            .setStyle(ButtonStyle.Primary);

        const shuffleButton = new ButtonBuilder()
            .setCustomId('shuffle')
            .setEmoji(SHUFFLE_BUTTON_EMOJI)
            .setStyle(ButtonStyle.Primary);

        const stopButton = new ButtonBuilder()
            .setCustomId('stop')
            .setEmoji(STOP_BUTTON_EMOJI)
            .setStyle(ButtonStyle.Danger);

        const pauseButton = new ButtonBuilder()
            .setCustomId('pause')
            .setEmoji(pauseEmoji)
            .setStyle(ButtonStyle.Secondary);

        const skipButton = new ButtonBuilder()
            .setCustomId('skip')
            .setEmoji(SKIP_BUTTON_EMOJI)
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(prevButton, shuffleButton, stopButton, pauseButton, skipButton);
        
        return row;
    },

    async editDisplay(outputMessage, guildId) {
        let currentInteractionIndex = getCurrentInteractionIndex(guildId);
        let currentMessageIndex = getCurrentMessageIndex(guildId);

        //This is a little weird but edits the interaction if it 
        //can (so that it isn't constantly defered), 
        //and edits the message if it can't (after 15 minutes)
        let response;
        try {
            response = await currentInteraction[currentInteractionIndex][1].editReply(outputMessage);
        } catch (err) {
            response = await currentMessage[currentMessageIndex][1].edit(outputMessage);
        }

        return response;
    },

    async manageDisplay(url, guildId, videoTitle, thumbnailUrl, singer, channelUrl) {
        const row = this.createTheButtons();

        //Gets user's name to display who added the current song
        const member = await getCurrentSongOwner();

        // The message to be sent
        let outputMessage = {
            "content": "",
            "components": [row],
            "tts": false,
            "embeds": [
                {
                    "type": "rich",
                    "title": `${videoTitle}`,
                    "description": `*[${singer}](${channelUrl})*`,
                    "color": `${member.user.accentColor ? member.user.accentColor : 0xffe897}`,
                    "image": {
                        "url": `${thumbnailUrl}`,
                        "height": 0,
                        "width": 0
                    },
                    "author": {
                        "name": `Currently Playing `
                    },
                    "footer": {
                        "text": `Added by ${member.nickname ? member.nickname : member.user.globalName}`,  // If the user has a nickname in this server, use that. Otherwise, just use their username
                        "icon_url": `${member.avatarURL() ? member.avatarURL() : member.user.displayAvatarURL()}`  // If the user has a server specific avatar, display that. Otherwise, just use their global avatar
                    },
                    "url": `${url}`
                }
            ]
        }

        this.editDisplay(outputMessage, guildId);

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000
        });

        collector.on('collect', async i => {
            const selection = i.values[0];
            await i.reply(`${i.user} has selected ${selection}!`);
        })
    },

    async displayDownloadPercent(perc, guildId, url, videoTitle, thumbnailUrl, singer, channelUrl) {
        let percFormatted = Math.round(perc).toString();

        //Gets user's name to display who added the current song
        const member = await getCurrentSongOwner();

        // Determines loading percentage
        let progressBar = ""
        for (let i = 0; i < Math.round(perc / 10); i++) {
            progressBar += "█"
        }
        for (let i = 0; i < 10 - Math.round(perc / 10); i++) {
            progressBar += "▒"
        }

        // The message to be sent
        let outputMessage = {
            "content": "",
            "tts": false,
            "embeds": [
                {
                    "type": "rich",
                    "title": `${videoTitle}`,
                    "description": `*[${singer}](${channelUrl})*`,
                    "color": `${member.user.accentColor ? member.user.accentColor : 0xffe897}`,
                    "thumbnail": {
                        "url": `${thumbnailUrl}`,
                        "height": 0,
                        "width": 0
                    },
                    "fields": [
                        {
                            "name": `${progressBar}`,
                            "value": `${percFormatted}%`
                        }
                    ],
                    "author": {
                        "name": `Loading`
                    },
                    "footer": {
                        "text": `Added by ${member.nickname ? member.nickname : member.user.globalName}`,  // If the user has a nickname in this server, use that. Otherwise, just use their username
                        "icon_url": `${member.avatarURL() ? member.avatarURL() : member.user.displayAvatarURL()}`  // If the user has a server specific avatar, display that. Otherwise, just use their global avatar
                    },
                    "url": `${url}`
                }
            ]
        }

        this.editDisplay(outputMessage, guildId);
    },

    async changePauseButton(state, guildId) {
        const row = this.createTheButtons(state == 'paused' ? true : false);

        const outputMessage = {
            components: [row]
        }

        this.editDisplay(outputMessage, guildId);
        
        return true
    }
}