const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('statystyki').setDescription('Pokazuje statystyki bota'),
    async execute(interaction) {
        await interaction.reply('Statystyki jeszcze do implementacji');
    }
};