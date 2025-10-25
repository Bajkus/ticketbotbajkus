const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Review = require('../models/Review'); // Twój model opinii
const config = require('../config.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton()) {
            try {
                // Sprawdzenie czy to button formularza opinii
                if (interaction.customId.startsWith('form_zamowienie')) {
                    // Tworzymy modal / embed do wypełnienia opinii
                    const channel = interaction.channel;

                    // Przykładowe pytania
                    const waitTime = 5; // Tutaj możesz zebrać wartości np. z select menu
                    const quality = 4;
                    const transaction = 5;
                    const comment = 'Super produkt!';

                    // Zapis do bazy
                    const review = new Review({
                        userId: interaction.user.id,
                        userTag: interaction.user.tag,
                        waitTime,
                        quality,
                        transaction,
                        comment
                    });

                    await review.save();

                    // Embed do kanału review
                    const embed = new EmbedBuilder()
                        .setTitle('Nowa opinia')
                        .setDescription(comment || 'Brak komentarza')
                        .addFields(
                            { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Czas oczekiwania', value: `${'★'.repeat(Math.max(0, Math.min(5, waitTime)))} (${waitTime}/5)`, inline: true },
                            { name: 'Jakość produktu', value: `${'★'.repeat(Math.max(0, Math.min(5, quality)))} (${quality}/5)`, inline: true },
                            { name: 'Przebieg transakcji', value: `${'★'.repeat(Math.max(0, Math.min(5, transaction)))} (${transaction}/5)`, inline: true }
                        )
                        .setFooter({ text: `Opinia od ${interaction.user.tag}` })
                        .setTimestamp();

                    const reviewChannel = interaction.guild.channels.cache.get(config.reviewChannelId);
                    if (reviewChannel) await reviewChannel.send({ embeds: [embed] });

                    // Potwierdzenie użytkownikowi
                    await interaction.update({ content: 'Dziękujemy za opinię!', components: [], embeds: [] });
                }

            } catch (err) {
                console.error('Błąd formularza opinii:', err);
                if (!interaction.replied) {
                    await interaction.followUp({ content: 'Coś poszło nie tak przy zapisie opinii.', ephemeral: true });
                }
            }
        }
    }
};
