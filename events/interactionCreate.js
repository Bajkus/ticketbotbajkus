// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        // Obsługa przycisków
        if (interaction.isButton()) {
            const guild = interaction.guild;
            const member = interaction.member;

            // Tworzenie kanału ticketowego
            const category = guild.channels.cache.find(c => c.name === 'Ticket Bot' && c.type === 4); // Kategoria
            const ticketName = `${interaction.customId}-${member.user.username}`.toLowerCase();

            const channel = await guild.channels.create({
                name: ticketName,
                type: 0, // tekstowy
                parent: category?.id || null,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
                    { id: member.id, allow: ['ViewChannel', 'SendMessages'] },
                ],
            });

            await channel.send(`${member}, twój ticket został utworzony!`);

            // Funkcja do zadawania pytań
            const ask = async (question) => {
                await channel.send(question);
                return new Promise((resolve, reject) => {
                    const filter = m => m.author.id === member.id;
                    const collector = channel.createMessageCollector({ filter, max: 1, time: 120000 });

                    collector.on('collect', m => resolve(m.content));
                    collector.on('end', collected => {
                        if (collected.size === 0) reject('Nie udzielono odpowiedzi na czas.');
                    });
                });
            };

            if (interaction.customId === 'panel_zamowienie') {
                await interaction.reply({ content: 'Tworzę ticket zamówienia...', ephemeral: true });

                try {
                    // Pytania o zamówienie
                    const produkt = await ask('Jaki produkt chcesz kupić?');
                    const ilosc = await ask('Ilość?');
                    const platnosc = await ask('Metoda płatności?');

                    await channel.send(`✅ Zamówienie przyjęte:
**Produkt:** ${produkt}
**Ilość:** ${ilosc}
**Płatność:** ${platnosc}`);

                    // Formularz opinii
                    await channel.send('Proszę ocenić transakcję (1-5 gwiazdek).');
                    const wait = parseInt(await ask('Czas oczekiwania (1-5):')) || 0;
                    const quality = parseInt(await ask('Jakość produktu (1-5):')) || 0;
                    const transaction = parseInt(await ask('Przebieg transakcji (1-5):')) || 0;
                    const commentRaw = await ask('Dodatkowy komentarz (opcjonalnie, wpisz "-" aby pominąć):');
                    const comment = commentRaw === '-' ? '' : commentRaw;

                    // Zapis opinii w MongoDB
                    const review = new Review({
                        userId: member.id,
                        userTag: member.user.tag,
                        waitTime: wait,
                        quality,
                        transaction,
                        comment,
                    });
                    await review.save();

                    // Embed do kanału opinii
                    const reviewChannel = guild.channels.cache.find(c => c.name === 'opinie');
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

                    await channel.send('Dziękujemy za opinię! Ticket zostanie zamknięty za 5 sekund.');
                    setTimeout(() => channel.delete().catch(() => {}), 5000);

                } catch (e) {
                    console.error(e);
                    await channel.send('Formularz nie został wypełniony na czas — ticket pozostanie otwarty.');
                }
            }

            if (interaction.customId === 'panel_reklamacja') {
                await interaction.reply({ content: 'Tworzę ticket reklamacji...', ephemeral: true });
                await channel.send('Kanał reklamacji utworzony. Moderator wkrótce się skontaktuje.');
            }
        }

        // Obsługa komend slash
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
