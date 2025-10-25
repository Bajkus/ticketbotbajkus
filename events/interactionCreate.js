const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // ---------- OBSŁUGA PRZYCISKÓW PANELU ----------
        if (interaction.isButton()) {
            const guild = interaction.guild;
            const member = interaction.member;
            const category = guild.channels.cache.find(c => c.name === 'Ticket Bot' && c.type === 4);
            const ticketName = `${interaction.customId}-${member.user.username}`.toLowerCase();

            // Tworzenie kanału ticketowego
            const channel = await guild.channels.create({
                name: ticketName,
                type: 0, // tekstowy
                parent: category?.id || null,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
                    { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                    { id: guild.members.me.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                ],
            });

            await channel.send(`${member}, Twój ticket został utworzony!`);

            // ---------- TICKET ZAMÓWIENIA MODAL ----------
            if (interaction.customId === 'panel_zamowienie') {
                await interaction.reply({ content: 'Otwieram formularz zamówienia...', ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId('zamowienie_modal')
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

                await interaction.showModal(modal);
            }

            // ---------- TICKET REKLAMACJI ----------
            if (interaction.customId === 'panel_reklamacja') {
                await interaction.reply({ content: 'Tworzę ticket reklamacji...', ephemeral: true });
                await channel.send('Kanał reklamacji utworzony. Moderator wkrótce się skontaktuje.');
            }
        }

        // ---------- OBSŁUGA MODALI ----------
        if (interaction.isModalSubmit()) {
            const channel = interaction.channel;
            const member = interaction.member;

            if (interaction.customId === 'zamowienie_modal') {
                const produkt = interaction.fields.getTextInputValue('produkt');
                const ilosc = interaction.fields.getTextInputValue('ilosc');
                const platnosc = interaction.fields.getTextInputValue('platnosc');

                await channel.send(`✅ Zamówienie przyjęte:
**Produkt:** ${produkt}
**Ilość:** ${ilosc}
**Płatność:** ${platnosc}`);

                await interaction.reply({ content: 'Dziękujemy! Formularz zamówienia został zapisany.', ephemeral: true });

                // Teraz otwieramy kolejny modal dla opinii
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

                await member.send({ content: 'Proszę wypełnić formularz opinii:', components: [] }); // Możesz wyświetlić modal w DM
                await interaction.showModal(opinionModal);
            }

            if (interaction.customId === 'opinia_modal') {
                const wait = parseInt(interaction.fields.getTextInputValue('wait')) || 0;
                const quality = parseInt(interaction.fields.getTextInputValue('quality')) || 0;
                const transaction = parseInt(interaction.fields.getTextInputValue('transaction')) || 0;
                const commentRaw = interaction.fields.getTextInputValue('comment');
                const comment = commentRaw === '-' ? '' : commentRaw;

                // Zapis opinii do MongoDB
                const review = new Review({
                    userId: member.id,
                    userTag: member.user.tag,
                    waitTime: wait,
                    quality,
                    transaction,
                    comment,
                });
                await review.save();

                // Wysłanie embedu do kanału opinii
                const reviewChannel = interaction.guild.channels.cache.find(c => c.name === 'opinie');
                if (reviewChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('Nowa opinia')
                        .setDescription(comment || 'Brak komentarza')
                        .addFields(
                            { name: 'Użytkownik', value: `<@${member.id}>`, inline: true },
                            { name: 'Czas oczekiwania', value: `${'★'.repeat(wait)} (${wait}/5)`, inline: true },
                            { name: 'Jakość produktu', value: `${'★'.repeat(quality)} (${quality}/5)`, inline: true },
                            { name: 'Przebieg transakcji', value: `${'★'.repeat(transaction)} (${transaction}/5)`, inline: true }
                        )
                        .setFooter({ text: `Opinia od ${member.user.tag}` })
                        .setTimestamp();
                    await reviewChannel.send({ embeds: [embed] });
                }

                await interaction.reply({ content: 'Dziękujemy za opinię! Ticket zostanie zamknięty.', ephemeral: true });
                setTimeout(() => channel.delete().catch(() => {}), 5000);
            }
        }

        // ---------- OBSŁUGA KOMEND SLASH ----------
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Wystąpił błąd podczas wykonywania komendy.', ephemeral: true });
            }
        }
    },
};
