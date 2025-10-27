const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Tworzy panel ticketowy (admin).'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ManageGuild'))
      return interaction.reply({ content: '❌ Brak uprawnień.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('🎫 Panel ticketowy')
      .setDescription('Kliknij przycisk, aby utworzyć ticket.')
      .setColor('#00AAFF');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket_order')
        .setLabel('🛒 Zamówienie')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('create_ticket_complaint')
        .setLabel('⚠️ Reklamacja')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.editReply({ content: '✅ Panel ticketowy został utworzony!' });
  }
};
