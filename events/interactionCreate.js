const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const Review = require('../models/Review'); // jeśli używasz MongoDB do opinii

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const { guild, member } = interaction;

        // =========================
        // Obsługa Slash Commands
        // =========================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(err);
                if (!interaction.replied) {
                    await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania komendy.', ephemeral: true });
                }
            }
        }

        // =========================
        // Obsługa Guzików
        // =========================
        if (interaction.isButton()) {
            const customId = interaction.customId;

            // --- Panel zamówienie / reklamacja ---
            if (customId === 'panel_zamowienie' || customId === 'panel_reklamacja') {
                await interaction.deferReply({ ephemeral: true }).catch(()=>{});
                try {
                    const ticketName = `${config.ticketPrefix}${member.user.username.toLowerCase()}`;
                    const ticketChannel = await guild.channels.create({
                        name: ticketName,
                        type: 0, // 0 = GUILD_TEXT
                        parent: config.ticketCategoryId,
                        permissionOverwrites: [
                            { id: guild.id, deny: ['ViewChannel'] },
                            { id: member.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                            { id: config.supportRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                        ]
                    });

                    const embed = new EmbedBuilder()
                        .setTitle(customId === 'panel_zamowienie' ? 'Formularz zamówienia' : 'Formularz reklamacji')
                        .setDescription(customId === 'panel_zamowienie' 
                            ? 'Kliknij poniższe przyciski, aby uzupełnić formularz zamówienia.'
                            : 'Kliknij poniższe przyciski, aby zgłosić reklamację.');

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('start_form')
                                .setLabel('Rozpocznij')
                                .setStyle(ButtonStyle.Primary)
                        );

                    await ticketChannel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });
                    await interaction.editReply({ content: `Ticket został utworzony: <#${ticketChannel.id}>`, ephemeral: true });
                } catch (err) {
                    console.error(err);
                    await interaction.editReply({ content: 'Nie udało się utworzyć ticketu.', ephemeral: true });
                }
            }

            // --- Start formularza zamówienia ---
            if (customId === 'start_form') {
                await interaction.deferReply({ ephemeral: true }).catch(()=>{});
                try {
                    const ticketChannel = interaction.channel;

                    const embed = new EmbedBuilder()
                        .setTitle('Formularz zamówienia')
                        .addFields(
                            { name: 'Jaki produkt chcesz kupić?', value: 'Napisz odpowiedź poniżej.' },
                            { name: 'Ilość', value: 'Napisz odpowiedź poniżej.' },
                            { name: 'Metoda płatności', value: 'Napisz odpowiedź poniżej.' }
                        )
                        .setFooter({ text: `Zamówienie od ${member.user.tag}` });

                    await ticketChannel.send({ content: `<@${member.id}>`, embeds: [embed] });
                    await interaction.editReply({ content: 'Formularz wysłany w ticket.', ephemeral: true });
                } catch (err) {
                    console.error(err);
                    await interaction.editReply({ content: 'Nie udało się wysłać formularza.', ephemeral: true });
                }
            }
        }
    }
};
