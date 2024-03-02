// Libraries
const { isInspirationPlaying } = require('../index')

const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const request = require('request');
const download = require('download');
const fs = require('fs');

require('dotenv').config();


let sessionID;
let picLink = 'http://inspirobot.me/api?generate=true'
request('http://inspirobot.me/api?getSessionID=1', function (err, response, body) {
    sessionID = body;
})
let link2 = `http://inspirobot.me//api?generateFlow=1&sessionID=${sessionID}`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inspireme')
        .setDescription('Provides an inspirational quote')
        .addStringOption(option =>
            option
                .setName('medium')
                .setDescription('Type "voice" into this field to have a constant background of inspirational quotes')
                .setRequired(false)),
    async execute(interaction) {
        if (interaction.options.getString('medium') != 'voice') {
            request(picLink, async function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    await interaction.reply('Be inspired');
                    await interaction.channel.send(body);
                }
            })
        } else {
            //Changes guild's isInspirationPlaying to true
            if (interaction.member.voice.channel) {
                let inspirationVoiceIndexExists = false
                for (let i = 0; i < isInspirationPlaying.length; i++) {
                    if (isInspirationPlaying[i][1] == interaction.guildId) {
                        isInspirationPlaying[i][0] = true
                        inspirationVoiceIndexExists = true
                    }
                }

                if (!inspirationVoiceIndexExists) {
                    isInspirationPlaying.push([true, interaction.guildId])
                    inspirationVoiceStatus = true
                }

                const voiceChannelId = interaction.member.voice.channel.id
                const filePath = `${__dirname}\\..\\files`;
                request(link2, async function (err, response, body) {
                    await download(JSON.parse(body).mp3, filePath)
                        .then(() => {
                            console.log('Download Completed');
                            playMP3File2(voiceChannelId, interaction.channel.guild, filePath + '\\' + JSON.parse(body).mp3.split('/')[4]); //Formats the filepath properly
                        })
                })
                await interaction.reply('Be inspired');
            } else {
                await interaction.reply('You must be in the voice channel to use this command');
            }
        }
    }
}

async function playMP3File2(voiceChannelId, guild, filePath) {
    let connection = getVoiceConnection(guild.id);

    if (!connection) {
        connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        })
    }

    //Converts filePath into an audio resource that works w/ connection
    const resource = createAudioResource(filePath);

    //Creates audio playing connection
    const player = createAudioPlayer();
    connection.subscribe(player);
    player.play(resource);

    //Waits until quote stops, then deletes it from the file and generates a new one
    player.addListener("stateChange", (oldOne, newOne) => {
        let inspirationVoiceStatus = false
        for (let i = 0; i < isInspirationPlaying.length; i++) {
            if (isInspirationPlaying[i][1] == guild.id) {
                inspirationVoiceStatus = isInspirationPlaying[i][0]
            }
        }

        if (newOne.status == "idle" && inspirationVoiceStatus) {
            try {
                fs.unlink(filePath, () => { }) //Deletes previous quote
            } catch (err) {
                console.error(err)
            }

            filePath = `${__dirname}\\..\\files`;

            request(link2, async function (err, response, body) {
                await download(JSON.parse(body).mp3, filePath)
                    .then(() => {
                        console.log('Download Completed');
                        //Plays the newly downloaded quote
                        player.play(createAudioResource(filePath + '\\' + JSON.parse(body).mp3.split('/')[4]));
                        filePath = filePath + '\\' + JSON.parse(body).mp3.split('/')[4];
                    })
            })
        }
    });

    player.on('error', err => {
        console.error(err);
    })
}