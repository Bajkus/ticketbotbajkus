// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isButton()) {
            const guild = interaction.guild;
            const member = interaction.member;
            const category = guild.channels.cache.find(c => c.name === 'Ticket Bot' && c.type === 4);
            const ticketName = `${interaction.customId}-${member.user.username}`.toLowerCase();

            const channel = await guild.channels.create({
                name: ticketName,
                type: 0,
                parent: category?.id || null,
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
                    { id: member.id, allow: ['ViewChannel', 'SendMessages'] },
                ],
            });

            await channel.send(`${member}, twój ticket został utworzony!`);

           if (interaction.customId === 'panel_zamowienie') {
    await interaction.reply({ content: 'Tworzę ticket zamówienia...', ephemeral: true });

    // Funkcja do zadawania pytań w tickecie
    const ask = async (channel, member, question) => {
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

    try {
        // Zbieranie odpowiedzi od użytkownika
        const produkt = await ask(channel, member, 'Jaki produkt chcesz kupić?');
        const ilosc = await ask(channel, member, 'Ilość?');
        const platnosc = await ask(channel, member, 'Metoda płatności?');

        await channel.send(`✅ Zamówienie przyjęte:
**Produkt:** ${produkt}
**Ilość:** ${ilosc}
**Płatność:** ${platnosc}`);

        // ---------- Formularz opinii ----------
        await channel.send('Proszę ocenić transakcję (1-5 gwiazdek).');

        const wait = parseInt(await ask(channel, member, 'Czas oczekiwania (1-5):')) || 0;
        const quality = parseInt(await ask(channel, member, 'Jakość produktu (1-5):')) || 0;
        const transaction = parseInt(await ask(channel, member, 'Przebieg transakcji (1-5):')) || 0;
        const commentRaw = await ask(channel, member, 'Dodatkowy komentarz (opcjonalnie, wpisz "-" aby pominąć):');
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

        // Wysyłka embed do kanału opinii
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
