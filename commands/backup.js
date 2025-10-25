const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sprawdza opóźnienie bota'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};

module.exports = {
data: new SlashCommandBuilder().setName('backup').setDescription('Wysyła wszystkie opinie w formie embedów (admin).'),
async execute(interaction) {
const isSupport = interaction.member.roles.cache.has(config.supportRoleId) || interaction.member.permissions.has('ManageGuild');
if (!isSupport) return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });


await interaction.reply({ content: 'Przygotowuję backup opinii...', ephemeral: true });
const all = await Review.find().sort({ createdAt: 1 }).lean();


if (!all.length) return interaction.followUp({ content: 'Brak opinii w bazie.', ephemeral: true });


// Send embeds in batches (max 10 embeds per message is safe)
const chunkSize = 8;
for (let i = 0; i < all.length; i += chunkSize) {
const chunk = all.slice(i, i + chunkSize);
const embeds = chunk.map((r, idx) => {
const e = new EmbedBuilder()
.setTitle(`Opinia #${i + idx + 1}`)
.setDescription(r.comment ? r.comment : 'Brak komentarza')
.addFields(
{ name: 'Użytkownik', value: r.userTag ? r.userTag : `<@${r.userId}>`, inline: true },
{ name: 'Czas oczekiwania', value: `${r.waitTime}/5`, inline: true },
{ name: 'Jakość produktu', value: `${r.quality}/5`, inline: true },
{ name: 'Przebieg transakcji', value: `${r.transaction}/5`, inline: true }
)
.setFooter({ text: new Date(r.createdAt).toLocaleString() });
return e;
});
await interaction.channel.send({ embeds });
}


await interaction.followUp({ content: `Wysłano ${all.length} opinii w embedach.`, ephemeral: true });
}
};
