const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // -------------------- PRZYCISKI --------------------
        if (interaction.isButton()) {
            const guild = interaction.guild;
            const member = interaction.member;

            // Panel zamówienie
            if (interaction.customId === 'panel_zamowienie') {
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${member.user.username}`,
                    type: 0,
                    permissionOverwrites: [
                        { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
                        { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                        { id: guild.members.me.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    ],
                });

                const embed = new EmbedBuilder()
                    .setTitle('Zamówienie')
                    .setDescription('Kliknij przycisk poniżej, aby wypełnić formularz zamówienia.');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`modal_zamowienie_${ticketChannel.id}`)
                            .setLabel('Wypełnij zamówienie')
                            .setStyle(ButtonStyle.Primary)
                    );

                await ticketChannel.send({ embeds: [embed], components: [row] });
                return interaction.reply({ content: 'Kanał ticketowy utworzony!', ephemeral: true });
            }

            // Kliknięcie przycisku w ticketowym kanale → pokazanie modala zamówienia
            if (interaction.customId.startsWith('modal_zamowienie_')) {
                const channelId = interaction.customId.split('_')[2];
                if (interaction.channel.id !== channelId)
                    return interaction.reply({ content: 'Ten przycisk nie jest dla tego kanału.', ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId(`zamowienie_modal_${channelId}`)
                    .setTitle('Formularz zamówienia');

                const produktInput = new TextInputBuilder()
                    .setCustomId('produkt')
                    .setLabel('Jaki produkt chcesz kupić?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const iloscInput = new TextInputBuilder()
                    .setCustomId('ilosc')
                    .setLabel('Ilość')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const platnoscInput = new TextInputBuilder()
                    .setCustomId('platnosc')
                    .setLabel('Metoda płatności')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(produktInput),
                    new ActionRowBuilder().addComponents(iloscInput),
                    new ActionRowBuilder().addComponents(platnoscInput)
                );

                return interaction.showModal(modal);
            }

            // Przycisk opinii z /zapytajopinia
            if (interaction.customId.startsWith('opinia_')) {
                const userId = interaction.customId.split('_')[1];
                if (interaction.user.id !== userId)
                    return interaction.reply({ content: 'To nie jest Twoja prośba o opinię.', ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId('opinia_modal')
                    .setTitle('Formularz opinii');

                const waitInput = new TextInputBuilder()
                    .setCustomId('wait')
                    .setLabel('Czas oczekiwania (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const qualityInput = new TextInputBuilder()
                    .setCustomId('quality')
                    .setLabel('Jakość produktu (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const transactionInput = new TextInputBuilder()
                    .setCustomId('transaction')
                    .setLabel('Przebieg transakcji (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const commentInput = new TextInputBuilder()
                    .setCustomId('comment')
                    .setLabel('Dodatkowy komentarz (opcjonalnie)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(waitInput),
                    new ActionRowBuilder().addComponents(qualityInput),
                    new ActionRowBuilder().addComponents(transactionInput),
                    new ActionRowBuilder().addComponents(commentInput)
                );

                return interaction.showModal(modal);
            }
        }

        // -------------------- MODALE --------------------
        if (interaction.isModalSubmit()) {
            let ticketChannel;

            // Zamówienie
            if (interaction.customId.startsWith('zamowienie_modal_')) {
                const channelId = interaction.customId.split('_')[2];
                ticketChannel = interaction.guild.channels.cache.get(channelId);
                if (!ticketChannel?.isTextBased()) return;

                const produkt = interaction.fields.getTextInputValue('produkt');
                const ilosc = interaction.fields.getTextInputValue('ilosc');
                const platnosc = interaction.fields.getTextInputValue('platnosc');

                const embed = new EmbedBuilder()
                    .setTitle('Nowe zamówienie')
                    .addFields(
                        { name: 'Produkt', value: produkt, inline: true },
                        { name: 'Ilość', value: ilosc, inline: true },
                        { name: 'Metoda płatności', value: platnosc, inline: true }
                    )
                    .setFooter({ text: `Użytkownik: ${interaction.user.tag}` })
                    .setTimestamp();

                await ticketChannel.send({ embeds: [embed] });
                await interaction.reply({ content: 'Zamówienie zapisane!', ephemeral: true });

                // Pokazujemy modal opinii po zamówieniu
                const opinionModal = new ModalBuilder()
                    .setCustomId('opinia_modal')
                    .setTitle('Formularz opinii');

                const waitInput = new TextInputBuilder()
                    .setCustomId('wait')
                    .setLabel('Czas oczekiwania (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const qualityInput = new TextInputBuilder()
                    .setCustomId('quality')
                    .setLabel('Jakość produktu (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const transactionInput = new TextInputBuilder()
                    .setCustomId('transaction')
                    .setLabel('Przebieg transakcji (1-5)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const commentInput = new TextInputBuilder()
                    .setCustomId('comment')
                    .setLabel('Dodatkowy komentarz (opcjonalnie)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);

                opinionModal.addComponents(
                    new ActionRowBuilder().addComponents(waitInput),
                    new ActionRowBuilder().addComponents(qualityInput),
                    new ActionRowBuilder().addComponents(transactionInput),
                    new ActionRowBuilder().addComponents(commentInput)
                );

                return interaction.showModal(opinionModal);
            }

            // Opinie
            if (interaction.customId === 'opinia_modal') {
                const wait = parseInt(interaction.fields.getTextInputValue('wait')) || 0;
                const quality = parseInt(interaction.fields.getTextInputValue('quality')) || 0;
                const transaction = parseInt(interaction.fields.getTextInputValue('transaction')) || 0;
                const commentRaw = interaction.fields.getTextInputValue('comment');
                const comment = commentRaw === '-' ? '' : commentRaw;

                const review = new Review({
                    userId: interaction.user.id,
                    userTag: interaction.user.tag,
                    waitTime: wait,
                    quality,
                    transaction,
                    comment,
                });
                await review.save();

                const reviewChannel = interaction.guild.channels.cache.find(c => c.name === 'opinie');
                if (reviewChannel?.isTextBased()) {
                    const embed = new EmbedBuilder()
                        .setTitle('Nowa opinia')
                        .setDescription(comment || 'Brak komentarza')
                        .addFields(
                            { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Czas oczekiwania', value: `${'★'.repeat(wait)} (${wait}/5)`, inline: true },
                            { name: 'Jakość produktu', value: `${'★'.repeat(quality)} (${quality}/5)`, inline: true },
                            { name: 'Przebieg transakcji', value: `${'★'.repeat(transaction)} (${transaction}/5)`, inline: true }
                        )
                        .setFooter({ text: `Opinia od ${interaction.user.tag}` })
                        .setTimestamp();
                    await reviewChannel.send({ embeds: [embed] });
                }

                await interaction.reply({ content: 'Dziękujemy za opinię! Ticket zostanie zamknięty.', ephemeral: true });

                if (ticketChannel) setTimeout(() => ticketChannel.delete().catch(() => {}), 5000);
            }
        }
    }
};
