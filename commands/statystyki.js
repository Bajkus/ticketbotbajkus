// commands/statystyki.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statystyki')
        .setDescription('Wyświetla statystyki wszystkich opinii'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        try {
            const reviews = await Review.find({});
            if (!reviews.length) return interaction.editReply('Brak opinii w bazie danych.');

            const totalReviews = reviews.length;
            const avgWait = (reviews.reduce((sum, r) => sum + r.waitTime, 0) / totalReviews).toFixed(2);
            const avgQuality = (reviews.reduce((sum, r) => sum + r.quality, 0) / totalReviews).toFixed(2);
            const avgTransaction = (reviews.reduce((sum, r) => sum + r.transaction, 0) / totalReviews).toFixed(2);

            const embed = new EmbedBuilder()
                .setTitle('📊 Statystyki opinii')
                .addFields(
                    { name: 'Liczba opinii', value: `${totalReviews}`, inline: true },
                    { name: 'Średni czas oczekiwania', value: `${avgWait} ★`, inline: true },
                    { name: 'Średnia jakość produktu', value: `${avgQuality} ★`, inline: true },
                    { name: 'Średni przebieg transakcji', value: `${avgTransaction} ★`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania statystyk.' });
        }
    },
};
