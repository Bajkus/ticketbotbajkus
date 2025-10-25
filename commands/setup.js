const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Tworzy panel ticketowy (admin).'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageGuild'))
            return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });

        // 1️⃣ Od razu odpowiadamy, żeby Discord nie wyrzucił błędu
        await interaction.reply({ content: 'Tworzę panel ticketowy...', ephemeral: true });

        // 2️⃣ Tworzymy embed i przyciski
        const embed = new EmbedBuilder()
            .setTitle('Panel ticketowy')
            .setDescription('Wybierz typ ticketu:');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_zamowienie')
                .setLabel('🛒 Zamówienie')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('panel_reklamacja')
                .setLabel('⚠️ Reklamacja')
                .setStyle(ButtonStyle.Secondary)
        );

        // 3️⃣ Wysyłamy embed do kanału
        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 4️⃣ Aktualizujemy odpowiedź ephemeral
        await interaction.editReply({ content: 'Panel został utworzony!' });
    }
};
