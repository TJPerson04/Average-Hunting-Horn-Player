// Libraries
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { SlashCommandBuilder } = require("discord.js");
const { join } = require('node:path');

const { getYTTitle } = require("..//helpers/helper_functions");

// IDEAS
// Differentiate song title from artist (different font? bold? italics?)
// Length of song
// Number inside the queue (queueIndex + 1)
// Selection drop down bar to choose a specific song to play?

require('dotenv').config();


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
        let outputMessage = {
            "url": "https://www.youtube.com/watch?v=Hv72-q5m0uI",
            "content": "",
            "tts": false,
            "embeds": [
                {
                    "type": "rich",
                    "title": `So Right`,
                    "description": `*[Carly Rae Jepsen](https://www.youtube.com/@carlyraemusic)*`,
                    "color": `${0xffe897}`,
                    "image": {
                        "url": `https://cdn.discordapp.com/attachments/887793959089340466/1222687748872343602/so-right-song.png?ex=66171fb3&is=6604aab3&hm=5bcf9b321854da7c906b1c5ec0d4eb4a62e47d208275e83ffa086d0e35e93844&`,
                        "height": 0,
                        "width": 0
                    },
                    "author": {
                        "name": `Currently Playing `
                    },
                    "footer": {
                        "text": `Added by Me :)`,  // If the user has a nickname in this server, use that. Otherwise, just use their username
                        "icon_url": `https://cdn.discordapp.com/attachments/887793959089340466/1222219370801926234/cake-song.png?ex=66156b7d&is=6602f67d&hm=3befa2bc34276859762be778dac8784337286aeb302eb7149e4f0530e878617b&`  // If the user has a server specific avatar, display that. Otherwise, just use their global avatar
                    }
                }
            ]
        }

        let outputMessage2 = {
            "url": "https://www.youtube.com/watch?v=Hv72-q5m0uI",
            "content": "",
            "tts": false,
            "embeds": [
                {
                    "type": "rich",
                    // "description": `*[So Right](https://www.youtube.com/watch?v=MaLryQ80leE)* - *[Carly Rae Jepsen](https://www.youtube.com/channel/UC-4NAdFIP6h9BmtGUFL94Pg)*`,
                    // "description": ``,
                    "color": `${0xffe897}`,
                    // "thumbnail": {
                    //     "url": `https://cdn.discordapp.com/attachments/887793959089340466/1222220884492816607/so-right-song.png?ex=66156ce6&is=6602f7e6&hm=3f6bdb0a601b7fc5986561c0605882290e9eac7e87530ea638d427919c618262&`,
                    //     "height": 100,
                    //     "width": 100
                    // },
                    // "footer": {
                    //     "text": `Currently Playing So Right - Carly Rae Jepsen`,
                    //     "url": "https://www.youtube.com/watch?v=9J_qJYi7IBg",
                    //     "icon_url": `https://cdn.discordapp.com/attachments/887793959089340466/1222220884492816607/so-right-song.png?ex=66156ce6&is=6602f7e6&hm=3f6bdb0a601b7fc5986561c0605882290e9eac7e87530ea638d427919c618262&`
                    // },
                    // "fields": [
                    //     {
                    //         "name": `Up Next`,
                    //         "value": "\u200B",
                    //         "inline": false
                    //     }
                    // ],
                    "image": {
                        "url": `https://media.discordapp.net/attachments/887793959089340466/1222231996277981195/output-image.png?ex=6615773f&is=6603023f&hm=0f831d35977b37c6c5f1842f4b28bb2cb405e5dbcef24f285125296616232185&=&format=webp&quality=lossless&width=1100&height=618`,
                        "height": 0,
                        "width": 0
                    },
                    "title": `Up Next`
                }
            ]
        }

        interaction.reply(outputMessage2);
    }
}