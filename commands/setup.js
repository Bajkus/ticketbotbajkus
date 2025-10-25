const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Tworzy panel ticketowy (admin).'),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageGuild')) {
            return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });
        }

        // Od razu odpowiadamy, żeby uniknąć "did not respond"
        await interaction.reply({ content: 'Tworzę panel ticketowy...', ephemeral: true });

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

        try {
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: 'Panel został utworzony!' });
        } catch (err) {
            console.error('Błąd wysyłania panelu:', err);
            await interaction.editReply({ content: 'Nie udało się utworzyć panelu.' });
        }
    }
};
