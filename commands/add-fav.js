const { SlashCommandBuilder, Guild } = require("discord.js");
const { join } = require('node:path')
const fs = require('fs');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-fav')
        .setDescription('Connects a playlist link with a user - UNDER CONSTRUCTION')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('The playlist to save')
                .setRequired(true)),
    async execute(interaction) {
        db = JSON.parse(fs.readFileSync(join(__dirname, '\\..\\favs.json')));
        let isUserInLists = false;
        for (let i = 0; i < db.lists.length; i++) {
            if (db.lists[i][0] == interaction.user.id) {
                db.lists[i][1] = interaction.options.getString('url');
                isUserInLists = true;
            }
        }
        if (!isUserInLists) {
            db.lists.push([interaction.user.id, interaction.options.getString('url')]);
        }
        fs.writeFileSync(join(__dirname, '\\..\\favs.json'), JSON.stringify(db))
        interaction.reply('cool')
    }
}