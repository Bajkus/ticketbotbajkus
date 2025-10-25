const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder().setName('setup').setDescription('Setup ticket panel'),
    async execute(interaction) {
        await interaction.reply('Panel ticketów został utworzony!');
    }
};