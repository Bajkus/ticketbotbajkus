const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zapytajopinia')
        .setDescription('Wyślij formularz opinii do użytkownika.'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('modal_opinia')
            .setTitle('Formularz opinii');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('czas')
                    .setLabel('Czas oczekiwania (1-5)')
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('jakosc')
                    .setLabel('Jakość produktu (1-5)')
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('przebieg')
                    .setLabel('Przebieg transakcji (1-5)')
                    .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('komentarz')
                    .setLabel('Dodatkowy komentarz (opcjonalnie)')
                    .setStyle(TextInputStyle.Paragraph)
            )
        );

        await interaction.showModal(modal);
    }
};
