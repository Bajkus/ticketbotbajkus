const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // === KOMENDA /setup ===
      if (interaction.isChatInputCommand() && interaction.commandName === 'setup') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({
            content: '❌ Brak uprawnień do użycia tej komendy.',
            ephemeral: true,
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🎟️ Panel ticketowy')
          .setDescription('Kliknij odpowiedni przycisk, aby otworzyć ticket.')
          .setColor('#2b2d31');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('panel_zamowienie')
            .setLabel('🛒 Zamówienie')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('panel_reklamacja')
            .setLabel('⚠️ Reklamacja')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: '✅ Panel utworzony!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
      }

      // === OBSŁUGA PRZYCISKÓW ===
      if (interaction.isButton()) {
        const ticketType =
          interaction.customId === 'panel_zamowienie'
            ? 'Zamówienie'
            : interaction.customId === 'panel_reklamacja'
            ? 'Reklamacja'
            : null;

        if (!ticketType) return;

        // Tworzymy modal (formularz)
        const modal = new ModalBuilder()
          .setCustomId(`formularz_${ticketType}`)
          .setTitle(`Formularz: ${ticketType}`);

        const produkt = new TextInputBuilder()
          .setCustomId('produkt')
          .setLabel('🏷️ Nazwa produktu')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const ilosc = new TextInputBuilder()
          .setCustomId('ilosc')
          .setLabel('📦 Ilość produktów')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const metoda = new TextInputBuilder()
          .setCustomId('metoda')
          .setLabel('💳 Metoda płatności')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(produkt),
          new ActionRowBuilder().addComponents(ilosc),
          new ActionRowBuilder().addComponents(metoda)
        );

        await interaction.showModal(modal);
      }

      // === OBSŁUGA FORMULARZA ===
      if (interaction.isModalSubmit()) {
        if (!interaction.customId.startsWith('formularz_')) return;

        const typ = interaction.customId.split('_')[1];
        const produkt = interaction.fields.getTextInputValue('produkt');
        const ilosc = interaction.fields.getTextInputValue('ilosc');
        const metoda = interaction.fields.getTextInputValue('metoda');

        // Tworzenie kanału ticketa
        const channel = await interaction.guild.channels.create({
          name: `${config.ticketPrefix}${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: config.ticketCategoryId,
          topic: `Ticket użytkownika ${interaction.user.tag}`,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
              ],
            },
            {
              id: config.supportRoleId,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
              ],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle(`🎟️ Ticket - ${typ}`)
          .setColor('#5865f2')
          .setDescription(
            `Nowy ticket od <@${interaction.user.id}>\n\n🏷️ **Produkt:** ${produkt}\n📦 **Ilość:** ${ilosc}\n💳 **Metoda płatności:** ${metoda}`
          )
          .setTimestamp();

        await channel.send({ embeds: [embed] });

        await interaction.reply({
          content: `✅ Ticket został utworzony: ${channel}`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error('❌ Błąd w interactionCreate:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ Wystąpił nieoczekiwany błąd podczas przetwarzania interakcji.',
          ephemeral: true,
        });
      }
    }
  },
};
