const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Review = require('../models/Review');
const Order = require('../models/Order');
const config = require('../config.json');


module.exports = {
data: new SlashCommandBuilder().setName('statystyki').setDescription('Wyświetla statystyki opinii (admin).'),
async execute(interaction) {
// permission: support role or manage guild
const isSupport = interaction.member.roles.cache.has(config.supportRoleId) || interaction.member.permissions.has('ManageGuild');
if (!isSupport) return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });


const total = await Review.countDocuments();
const avg = await Review.aggregate([
{ $group: { _id: null, waitAvg: { $avg: '$waitTime' }, qualityAvg: { $avg: '$quality' }, transAvg: { $avg: '$transaction' } } }
]);


const ordersCount = await Order.countDocuments({ type: 'zamowienie' });
const complaintsCount = await Order.countDocuments({ type: 'reklamacja' });


const embed = new EmbedBuilder().setTitle('Statystyki opinii').addFields(
{ name: 'Łącznie opinii', value: String(total), inline: true },
{ name: 'Zamówienia', value: String(ordersCount), inline: true },
{ name: 'Reklamacje', value: String(complaintsCount), inline: true }
);


if (avg && avg.length > 0) {
embed.addFields(
{ name: 'Średnia — Czas oczekiwania', value: (avg[0].waitAvg || 0).toFixed(2), inline: true },
{ name: 'Średnia — Jakość', value: (avg[0].qualityAvg || 0).toFixed(2), inline: true },
{ name: 'Średnia — Przebieg transakcji', value: (avg[0].transAvg || 0).toFixed(2), inline: true }
);
}


await interaction.reply({ embeds: [embed], ephemeral: true });
}
};
