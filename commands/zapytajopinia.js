const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('opinia')
    .setDescription('Wyślij formularz opinii do użytkownika.'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('review_modal')
      .setTitle('📝 Formularz opinii');

    const opinion = new TextInputBuilder()
      .setCustomId('opinion')
      .setLabel('Twoja opinia')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const rating = new TextInputBuilder()
      .setCustomId('rating')
      .setLabel('Ocena (1–5)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(opinion);
    const row2 = new ActionRowBuilder().addComponents(rating);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }
};
