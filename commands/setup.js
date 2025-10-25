const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Tworzy panel ticketowy (admin).'),

    async execute(interaction) {
        // Sprawdzenie uprawnień
        if (!interaction.member.permissions.has('ManageGuild')) {
            return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });
        }

        // Od razu informujemy Discord, że odpowiedź nadejdzie
        await interaction.deferReply({ ephemeral: true });

        try {
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

            // Wysyłamy panel w aktualnym kanale
            await interaction.channel.send({ embeds: [embed], components: [row] });

            // Edytujemy odpowiedź dla użytkownika
            await interaction.editReply({ content: 'Panel został utworzony!' });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: 'Nie udało się utworzyć panelu.', ephemeral: true });
        }
    }
};
