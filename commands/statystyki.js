const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statystyki')
        .setDescription('Pokazuje średnie oceny z opinii.'),
    async execute(interaction) {
        const reviews = await Review.find();
        if (!reviews.length) return interaction.reply({ content: 'Brak opinii.', ephemeral: true });

        const avgWait = (reviews.reduce((a, r) => a + r.waitTime, 0) / reviews.length).toFixed(2);
        const avgQuality = (reviews.reduce((a, r) => a + r.quality, 0) / reviews.length).toFixed(2);
        const avgTrans = (reviews.reduce((a, r) => a + r.transaction, 0) / reviews.length).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('Statystyki opinii')
            .addFields(
                { name: 'Średni czas oczekiwania', value: `${avgWait}/5`, inline: true },
                { name: 'Średnia jakość produktu', value: `${avgQuality}/5`, inline: true },
                { name: 'Średni przebieg transakcji', value: `${avgTrans}/5`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
