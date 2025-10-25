const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction } = require('discord.js');
const Review = require('../models/Review');
const config = require('../config.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // Komenda / button
            if (interaction.isButton()) {
                // Ticket buttons
                if (interaction.customId.startsWith('panel_')) {
                    const type = interaction.customId.split('_')[1]; // zamowienie / reklamacja
                    const ticketName = `${config.ticketPrefix}${type}-${interaction.user.username}`.toLowerCase();

                    // Tworzymy kanał ticket
                    const ticketChannel = await interaction.guild.channels.create({
                        name: ticketName,
                        type: 0, // GUILD_TEXT
                        parent: config.ticketCategoryId,
                        permissionOverwrites: [
                            { id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
                            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                        ]
                    });

                    // Embed i button do wypełnienia formularza
                    const embed = new EmbedBuilder()
                        .setTitle(`Ticket: ${type}`)
                        .setDescription('Kliknij przycisk aby wypełnić formularz.');

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`form_${type}`)
                            .setLabel('Wypełnij formularz')
                            .setStyle(ButtonStyle.Primary)
                    );

                    await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
                    await interaction.reply({ content: `Kanał ticket został utworzony: <#${ticketChannel.id}>`, ephemeral: true });
                }

                // Formularz zamówienia / reklamacj
                if (interaction.customId.startsWith('form_')) {
                    // Modal z pytaniami o zamówienie
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

                    // Tutaj możesz zrobić analogicznie dla reklamacji
                }
            }

            // Obsługa modal submit (po wypełnieniu formularza)
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'modal_zamowienie') {
                    const produkt = interaction.fields.getTextInputValue('produkt');
                    const ilosc = interaction.fields.getTextInputValue('ilosc');
                    const platnosc = interaction.fields.getTextInputValue('platnosc');

                    // Embed do kanału ticket
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
                    await interaction.reply({ content: 'Zamówienie zostało zapisane!', ephemeral: true });
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
