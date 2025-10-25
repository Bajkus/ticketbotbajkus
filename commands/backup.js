const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Wysyła wszystkie opinie w embedach.'),
    async execute(interaction) {
        const reviews = await Review.find();
        if (!reviews.length) return interaction.reply({ content: 'Brak opinii.', ephemeral: true });

        for (const r of reviews) {
            const embed = new EmbedBuilder()
                .setTitle('Opinia')
                .addFields(
                    { name: 'Użytkownik', value: `<@${r.userId}>`, inline: true },
                    { name: 'Czas oczekiwania', value: `${'★'.repeat(r.waitTime)} (${r.waitTime}/5)`, inline: true },
                    { name: 'Jakość produktu', value: `${'★'.repeat(r.quality)} (${r.quality}/5)`, inline: true },
                    { name: 'Przebieg transakcji', value: `${'★'.repeat(r.transaction)} (${r.transaction}/5)`, inline: true },
                    { name: 'Komentarz', value: r.comment || 'Brak komentarza', inline: false }
                )
                .setTimestamp();
            await interaction.user.send({ embeds: [embed] }).catch(() => {});
        }

        await interaction.reply({ content: 'Opinie wysłane na DM.', ephemeral: true });
    }
};
