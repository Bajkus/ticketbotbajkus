const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../config.json');
const Review = require('../models/Review'); // Twój model opinii z MongoDB

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {

            // --- Guziki panelu ticketowego ---
            if (interaction.isButton()) {
                const { guild, member, customId } = interaction;

                // Tworzenie ticketu
                if (customId === 'panel_zamowienie' || customId === 'panel_reklamacja') {
                    await interaction.deferUpdate();

                    const ticketName = `${customId === 'panel_zamowienie' ? 'zamowienie' : 'reklamacja'}-${member.user.username}`;

                    const ticketChannel = await guild.channels.create({
                        name: ticketName,
                        type: 0, // GUILD_TEXT
                        parent: config.ticketCategoryId,
                        permissionOverwrites: [
                            { id: guild.id, deny: ['ViewChannel'] },
                            { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                            { id: config.supportRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                        ]
                    }).catch(err => console.error(err));

                    if (!ticketChannel) return interaction.followUp({ content: 'Nie udało się utworzyć ticketu.', ephemeral: true });

                    // Embed i przyciski w tickecie
                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket: ${customId === 'panel_zamowienie' ? 'Zamówienie' : 'Reklamacja'}`)
                        .setDescription('Kliknij przycisk, aby wypełnić formularz lub dodać opinię.');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket_formularz')
                            .setLabel('Wypełnij formularz')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('ticket_opinia')
                            .setLabel('Dodaj opinię')
                            .setStyle(ButtonStyle.Success)
                    );

                    await ticketChannel.send({ embeds: [embed], components: [row] });
                }

                // --- Guzik w tickecie do wypełnienia formularza zamówienia ---
                if (customId === 'ticket_formularz') {
                    await interaction.deferUpdate();

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

                // --- Guzik w tickecie do opinii ---
                if (customId === 'ticket_opinia') {
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

            // --- Modale ---
            if (interaction.isModalSubmit()) {
                // Formularz zamówienia
                if (interaction.customId === 'modal_zamowienie') {
                    const produkt = interaction.fields.getTextInputValue('produkt');
                    const ilosc = interaction.fields.getTextInputValue('ilosc');
                    const platnosc = interaction.fields.getTextInputValue('platnosc');

                    const embed = new EmbedBuilder()
                        .setTitle('Nowe zamówienie')
                        .addFields(
                            { name: 'Produkt', value: produkt, inline: true },
                            { name: 'Ilość', value: ilosc, inline: true },
                            { name: 'Metoda płatności', value: platnosc, inline: true },
                            { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: false });
                }

                // Formularz opinii
                if (interaction.customId === 'modal_opinia') {
                    const wait = parseInt(interaction.fields.getTextInputValue('czas')) || 0;
                    const quality = parseInt(interaction.fields.getTextInputValue('jakosc')) || 0;
                    const transaction = parseInt(interaction.fields.getTextInputValue('przebieg')) || 0;
                    const comment = interaction.fields.getTextInputValue('komentarz') || '';

                    const review = new Review({
                        userId: interaction.user.id,
                        userTag: interaction.user.tag,
                        waitTime: wait,
                        quality,
                        transaction,
                        comment
                    });
                    await review.save().catch(console.error);

                    const embed = new EmbedBuilder()
                        .setTitle('Nowa opinia')
                        .addFields(
                            { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Czas oczekiwania', value: `${'★'.repeat(Math.max(0, Math.min(5, wait)))} (${wait}/5)`, inline: true },
                            { name: 'Jakość produktu', value: `${'★'.repeat(Math.max(0, Math.min(5, quality)))} (${quality}/5)`, inline: true },
                            { name: 'Przebieg transakcji', value: `${'★'.repeat(Math.max(0, Math.min(5, transaction)))} (${transaction}/5)`, inline: true },
                            { name: 'Komentarz', value: comment || 'Brak komentarza' }
                        )
                        .setTimestamp();

                    const reviewChannel = interaction.guild.channels.cache.get(config.reviewChannelId);
                    if (reviewChannel) await reviewChannel.send({ embeds: [embed] });

                    await interaction.reply({ content: 'Dziękujemy za opinię!', ephemeral: true });
                }
            }

            // --- Slash commands ---
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (err) {
                    console.error(err);
                    await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania komendy.', ephemeral: true });
                }
            }

        } catch (err) {
            console.error('Błąd interactionCreate:', err);
            if (interaction.replied || interaction.deferred) return;
            await interaction.reply({ content: 'Coś poszło nie tak.', ephemeral: true });
        }
    }
};
