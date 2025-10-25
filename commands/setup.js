const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Tworzy panel ticketowy (admin).'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageGuild')) 
            return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('Panel ticketowy')
            .setDescription('Wybierz typ ticketu:');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_zamowienie')
                .setLabel('🛒 Zamówienie')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('panel_reklamacja')
                .setLabel('⚠️ Reklamacja')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Panel został utworzony.', ephemeral: true });
    }
};
