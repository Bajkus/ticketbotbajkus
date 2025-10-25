const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('backup').setDescription('Backup opinii w embedach'),
    async execute(interaction) {
        await interaction.reply('Backup jeszcze do implementacji');
    }
};