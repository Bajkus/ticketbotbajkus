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
            // BUTTONS
            if (interaction.isButton()) {
                // Ticket panel buttons
                if (interaction.customId.startsWith('panel_')) {
                    await interaction.deferUpdate(); // <- kluczowe dla uniknięcia "This interaction failed"

                    const type = interaction.customId.split('_')[1]; // zamowienie / reklamacja
                    const ticketName = `${config.ticketPrefix}${type}-${interaction.user.username}`.toLowerCase();

                    // Tworzymy kanał ticket w kategorii
                    const ticketChannel = await interaction.guild.channels.create({
                        name: ticketName,
                        type: 0, // GUILD_TEXT
                        parent: config.ticketCategoryId,
                        permissionOverwrites: [
                            { id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
                            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                        ]
                    });

                    // Embed i przycisk do formularza
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
                    await interaction.followUp({ content: `Kanał ticket został utworzony: <#${ticketChannel.id}>`, ephemeral: true });
                }

                // BUTTON do formularza
                if (interaction.customId.startsWith('form_')) {
                    await interaction.deferUpdate(); // <- konieczne

                    // Modal dla zamówienia
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

                    // Tutaj możesz analogicznie dodać modal dla reklamacji
                }
            }

            // MODAL SUBMIT
            if (interaction.isModalSubmit()) {
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
                    await interaction.reply({ content: 'Zamówienie zostało zapisane!', ephemeral: true });

                    // Możesz tutaj też zapisać dane w MongoDB jeśli chcesz
                    // const review = new Review({ ... }); await review.save();
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
