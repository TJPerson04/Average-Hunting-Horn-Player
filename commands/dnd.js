// Libraries
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { SlashCommandBuilder } = require("discord.js");
const { join } = require('node:path');
const { client } = require('../index')

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
        const lib = require('lib')({ token: process.env.STDLIB_SECRET_TOKEN });
        let test3 = await interaction.guild.emojis.fetch()
            .then(emojis => {
                return emojis.find(x => x.name == 'Namess' || x.toString() == 'Namess')
            }).catch(err => {console.error(err)})
        let test2 = await interaction.guild.emojis
        // await interaction.guild.emojis.create({attachment: 'https://npr.brightspotcdn.com/dims4/default/67c6173/2147483647/strip/true/crop/1023x912+0+0/resize/880x785!/quality/90/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F2b%2F18%2Fc042b647406185b7de55c332432e%2Fmeeko-racoon-01-1024x1024.jpg', name: 'Namess'})
        // await interaction.guild.emojis.edit({name: 'Namess', attachment: 'https://people.com/thmb/CVCMobv9fzMPSdgy8h1eCOfZKPY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(999x0:1001x2)/raccoon1-271156448c6e4008aea8535e1eec4ca5.jpg'})
        // await test3.edit({attachment: 'https://people.com/thmb/CVCMobv9fzMPSdgy8h1eCOfZKPY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(999x0:1001x2)/raccoon1-271156448c6e4008aea8535e1eec4ca5.jpg'})
        await test3.delete()
        let test = {
            "content": "",
            "tts": false,
            "embeds": [
                {
                    "type": "rich",
                    "title": `Queue`,
                    "description": "",
                    "color": 0xffe897,
                    "fields": [
                        {
                            "name": `Currently Playing`,
                            "value": `Feather - Sabrina Carpenter`,
                        },
                        {
                            "name": `Up Next`,
                            "value": `<:pause:1124381774844285008>exes - Tate McRae\nSunflower - Spidermand\nTraining Season - Dua Lipa`
                        }
                    ]
                }
            ]
        }

            interaction.reply(test);
        // const song = interaction.options.getString('song');
        // const textChannel = interaction.channel;
        // let filePath;

        // let voiceChannelId;
        // if (interaction.member.voice.channel) {
        //     voiceChannelId = interaction.member.voice.channel.id;
        // } else {
        //     await interaction.reply('You must be in a voice channel to use this command');
        //     return
        // }

        // switch (song) {
        //     case 'panic':
        //         filePath = join(__dirname, '\\..\\dnd\\LobotomyCorporation_OST_Second_Warning.mp3');
        //         break;
        //     case 'church':
        //         filePath = join(__dirname, '\\..\\dnd\\Arknights_OST_bat_white_trans.mp3');
        //         break;
        //     case '2':
        //         filePath = join(__dirname, '\\..\\dnd\\Arknights_OST_bat_act17side_01.mp3')
        //         break;
        // }

        // if (!filePath) {
        //     interaction.reply('Unkown song');
        //     return
        // }

        // let connection;
        // if (getVoiceConnection(interaction.guildId)) {
        //     connection = getVoiceConnection(interaction.guildId);
        // } else {
        //     connection = joinVoiceChannel({
        //         channelId: voiceChannelId,
        //         guildId: textChannel.guild.id,
        //         adapterCreator: textChannel.guild.voiceAdapterCreator,
        //     })
        // }
        // const player = createAudioPlayer();
        // const resource = createAudioResource(filePath);

        // connection.subscribe(player);
        // player.play(resource);

        // //I have absolutely no clue what this bit of code does, stole it off the internet and it fixed a bug
        // const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
        //     const newUdp = Reflect.get(newNetworkState, 'udp');
        //     clearInterval(newUdp?.keepAliveInterval);
        // }

        // connection.on('stateChange', (oldState, newState) => {
        //     const oldNetworking = Reflect.get(oldState, 'networking');
        //     const newNetworking = Reflect.get(newState, 'networking');

        //     oldNetworking?.off('stateChange', networkStateChangeHandler);
        //     newNetworking?.on('stateChange', networkStateChangeHandler);
        // });

        // interaction.reply('Playing song');
    }
}