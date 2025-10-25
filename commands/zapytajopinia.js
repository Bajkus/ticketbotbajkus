const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zapytajopinia')
        .setDescription('Wysyła prośbę o opinię do użytkownika')
        .addUserOption(option =>
            option.setName('uzytkownik')
                .setDescription('Użytkownik, którego chcesz zapytać')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageGuild')) {
            return interaction.reply({ content: 'Brak uprawnień.', flags: 64 });
        }

        const user = interaction.options.getUser('uzytkownik');

        const embed = new EmbedBuilder()
            .setTitle('Prośba o opinię')
            .setDescription('Kliknij przycisk, aby wypełnić formularz opinii dotyczący Twojego zakupu.');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`opinia_${user.id}`)
                    .setLabel('Wypełnij opinię')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Wiadomość z prośbą o opinię została wysłana.', flags: 64 });
    }
};
