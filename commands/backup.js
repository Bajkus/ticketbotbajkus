// commands/backup.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Wyślij wszystkie opinie w embdedach'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const reviews = await Review.find({});
            if (!reviews.length) return interaction.editReply('Brak opinii do wysłania.');

            for (const rev of reviews) {
                const embed = new EmbedBuilder()
                    .setTitle('Opinia')
                    .setDescription(rev.comment || 'Brak komentarza')
                    .addFields(
                        { name: 'Użytkownik', value: `<@${rev.userId}>`, inline: true },
                        { name: 'Czas oczekiwania', value: `${'★'.repeat(rev.waitTime)}`, inline: true },
                        { name: 'Jakość produktu', value: `${'★'.repeat(rev.quality)}`, inline: true },
                        { name: 'Przebieg transakcji', value: `${'★'.repeat(rev.transaction)}`, inline: true }
                    )
                    .setFooter({ text: `Opinia od ${rev.userTag}` })
                    .setTimestamp();

                await interaction.channel.send({ embeds: [embed] });
            }

            await interaction.editReply({ content: '✅ Wszystkie opinie zostały wysłane.' });
        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Wystąpił błąd podczas wysyłania opinii.' });
        }
    },
};
