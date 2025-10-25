const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zapytajopinia')
        .setDescription('Wysyła prośbę o opinię do użytkownika.')
        .addUserOption(option => option.setName('uzytkownik').setDescription('Użytkownik').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageGuild')) 
            return interaction.reply({ content: 'Brak uprawnień.', ephemeral: true });

        const user = interaction.options.getUser('uzytkownik');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`opinia_${user.id}`)
                .setLabel('Wypełnij opinię')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ content: `<@${user.id}> proszę o wypełnienie opinii.`, components: [row] });
        await interaction.reply({ content: 'Prośba o opinię wysłana.', ephemeral: true });
    }
};
