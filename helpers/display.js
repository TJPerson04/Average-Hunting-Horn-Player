// Libraries
const { currentInteraction, currentMessage } = require('../index');
const { getCurrentSongOwner, getCurrentInteractionIndex, getCurrentMessageIndex, deleteEmojiByName, createEmoji } = require('./helper_functions');

const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');


// Constants
PREVIOUS_BUTTON_EMOJI = '<:previous_trans:1132482554570735657>';
SHUFFLE_BUTTON_EMOJI = '<:shuffle:1132485858537254984>';
STOP_BUTTON_EMOJI = '<:trans_stop:1132480218343424020>';
PAUSE_BUTTON_EMOJI = '<:pause_trans:1132482406453092482>';
PLAY_BUTTON_EMOJI = '<:play:1124382171633819758>';
SKIP_BUTTON_EMOJI = '<:next_trans:1132482765015748689>';


module.exports = {
    /**
     * Creates the 5 buttons for the various commands on the output display message
     * @param {boolean} isPaused Whether or not the song is currently paused
     * @returns {ActionRowBuilder} The row of components containing the buttons
     */
    createTheButtons(isPaused) {
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

    /**
     * Updates the output display
     * @param {*} outputMessage The message to be displayed 
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns The response of the interaction or message
     */
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

    /**
     * Creates the embed for the output message to display and displays it
     * @param {String} url The url of the song that is currently playing
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} videoTitle The title of the song
     * @param {String} thumbnailUrl The url for the thumbnail of the song
     * @param {String} singer The name of the singer/band
     * @param {String} channelUrl The url of the channel
     */
    async manageDisplay(url, guildId, videoTitle, thumbnailUrl, singer, channelUrl) {
        
        const row = module.exports.createTheButtons(false);

        //Gets user's name to display who added the current song
        const member = await getCurrentSongOwner(guildId);

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

        let response = await module.exports.editDisplay(outputMessage, guildId);

        const collector = await response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000
        });

        collector.on('collect', async i => {
            const selection = i.values[0];
            await i.reply(`${i.user} has selected ${selection}!`);
        })
    },

    /**
     * Displays a loading bar that represents the progress of the song downloading
     * @param {Number} perc How much the song has downloaded (percentage)
     * @param {String} guildId The id of the discord server the bot is playing in
     * @param {String} url The url of the song
     * @param {String} videoTitle The title of the song
     * @param {String} thumbnailUrl The url of the thumbnail
     * @param {String} singer The singer/band
     * @param {String} channelUrl The url to the channel
     */
    async displayDownloadPercent(perc, guildId, url, videoTitle, thumbnailUrl, singer, channelUrl) {
        let percFormatted = Math.round(perc).toString();

        //Gets user's name to display who added the current song
        const member = await getCurrentSongOwner(guildId);

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

        module.exports.editDisplay(outputMessage, guildId);
    },

    /**
     * Switches the emoji for the pause button between a pause symbol and a play symbol
     * @param {String} state "paused" if the song is currently paused, " " otherwise
     * @param {String} guildId The id of the discord server the bot is playing in
     * @returns {boolean} Returns true if run succecssfully
     */
    async changePauseButton(state, guildId) {
        const row = module.exports.createTheButtons(state == 'paused' ? true : false);

        const outputMessage = {
            components: [row]
        }

        module.exports.editDisplay(outputMessage, guildId);
        
        return true
    },

    /**
     * 
     * @param {str} guildId 
     * @param {str} currentTitle 
     * @param {str} currentThumbnail 
     * @param {Array<str>} otherTitles 
     * @param {Array<str>} otherThumbnails 
     */
    async manageQueueDisplay(guildId, currentTitle, currentThumbnail, otherTitles, otherThumbnails) {
        await createEmoji(guildId, 'currentlyPlaying', currentThumbnail)
        for (let i = 0; i < otherThumbnails.length(); i++) {
            await createEmoji(guildId, `song-${i + 1}`, otherThumbnails[i]);
        }
    }
}