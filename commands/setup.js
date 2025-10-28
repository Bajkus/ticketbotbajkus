const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Tworzy panel ticketowy (tylko administrator)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Tworzymy embed panelu ticketowego
      const embed = new EmbedBuilder()
        .setTitle('🎫 Panel ticketowy')
        .setDescription('Wybierz typ ticketa, aby rozpocząć zgłoszenie.')
        .setColor('Blue');

      // Tworzymy przyciski
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

      // Wysyłamy panel do kanału
      await interaction.channel.send({ embeds: [embed], components: [row] });

      // Odpowiedź ephemeral (żeby nie było „The application did not respond”)
      await interaction.reply({ content: '✅ Panel ticketowy został utworzony!', ephemeral: true });

    } catch (error) {
      console.error('Błąd podczas uruchamiania /setup:', error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Wystąpił błąd podczas tworzenia panelu.', ephemeral: true });
      }
    }
  }
};
