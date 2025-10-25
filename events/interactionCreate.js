const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const config = require('../config.json');
const Review = require('../models/Review');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // 1️⃣ BUTTONS
            if (interaction.isButton()) {
                // Panel ticketowy
                if (interaction.customId.startsWith('panel_')) {
                    await interaction.deferUpdate();

                    const type = interaction.customId.split('_')[1]; // zamowienie / reklamacja
                    const ticketName = `${config.ticketPrefix}${type}-${interaction.user.username}`.toLowerCase();

                    const ticketChannel = await interaction.guild.channels.create({
                        name: ticketName,
                        type: 0,
                        parent: config.ticketCategoryId,
                        permissionOverwrites: [
                            { id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
                            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                        ]
                    });

                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket: ${type}`)
                        .setDescription('Kliknij przycisk aby wypełnić formularz.');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`form_${type}`)
                            .setLabel('Wypełnij formularz')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('opinia')
                            .setLabel('Wystaw opinię')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
                    await interaction.followUp({ content: `Kanał ticket został utworzony: <#${ticketChannel.id}>`, ephemeral: true });
                }

                // Guzik formularza zamówienia
                if (interaction.customId.startsWith('form_')) {
                    await interaction.deferUpdate();

                    if (interaction.customId === 'form_zamowienie') {
                        const modal = new ModalBuilder()
                            .setCustomId('modal_zamowienie')
                            .setTitle('Formularz zamówienia');

                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('produkt')
                                    .setLabel('Jaki produkt chcesz kupić?')
                                    .setStyle(TextInputStyle.Short)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('ilosc')
                                    .setLabel('Ilość')
                                    .setStyle(TextInputStyle.Short)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('platnosc')
                                    .setLabel('Metoda płatności')
                                    .setStyle(TextInputStyle.Short)
                            )
                        );

                        await interaction.showModal(modal);
                    }
                }

                // Guzik opinii
                if (interaction.customId === 'opinia') {
                    await interaction.deferUpdate();

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
            }

            // 2️⃣ MODAL SUBMIT
            if (interaction.isModalSubmit()) {
                // Formularz zamówienia
                if (interaction.customId === 'modal_zamowienie') {
                    const produkt = interaction.fields.getTextInputValue('produkt');
                    const ilosc = interaction.fields.getTextInputValue('ilosc');
                    const platnosc = interaction.fields.getTextInputValue('platnosc');

                    const embed = new EmbedBuilder()
                        .setTitle('Nowe zamówienie')
                        .addFields(
                            { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Produkt', value: produkt, inline: true },
                            { name: 'Ilość', value: ilosc, inline: true },
                            { name: 'Metoda płatności', value: platnosc, inline: true }
                        )
                        .setTimestamp();

                    await interaction.channel.send({ embeds: [embed] });
                    await interaction.reply({ content: 'Zamówienie zapisane!', ephemeral: true });
                }

                // Formularz opinii
                if (interaction.customId === 'modal_opinia') {
                    const czas = parseInt(interaction.fields.getTextInputValue('czas')) || 0;
                    const jakosc = parseInt(interaction.fields.getTextInputValue('jakosc')) || 0;
                    const przebieg = parseInt(interaction.fields.getTextInputValue('przebieg')) || 0;
                    const komentarz = interaction.fields.getTextInputValue('komentarz');

                    // Zapis w MongoDB
                    const review = new Review({
                        userId: interaction.user.id,
                        userTag: interaction.user.tag,
                        waitTime: czas,
                        quality: jakosc,
                        transaction: przebieg,
                        comment: komentarz
                    });

                    await review.save().catch(console.error);

                    // Embed do kanału opinii
                    const reviewEmbed = new EmbedBuilder()
                        .setTitle('Nowa opinia')
                        .setDescription(komentarz || 'Brak komentarza')
                        .addFields(
                            { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Czas oczekiwania', value: `${'★'.repeat(Math.max(0, Math.min(5, czas)))} (${czas}/5)`, inline: true },
                            { name: 'Jakość produktu', value: `${'★'.repeat(Math.max(0, Math.min(5, jakosc)))} (${jakosc}/5)`, inline: true },
                            { name: 'Przebieg transakcji', value: `${'★'.repeat(Math.max(0, Math.min(5, przebieg)))} (${przebieg}/5)`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: `Opinia od ${interaction.user.tag}` });

                    const reviewChannel = interaction.guild.channels.cache.get(config.reviewChannelId);
                    if (reviewChannel) await reviewChannel.send({ embeds: [reviewEmbed] });

                    await interaction.reply({ content: 'Dziękujemy za opinię!', ephemeral: true });
                }
            }
        } catch (err) {
            console.error('Błąd interactionCreate:', err);
            if (!interaction.replied) {
                await interaction.followUp({ content: 'Coś poszło nie tak.', ephemeral: true });
            }
        }
    }
};
