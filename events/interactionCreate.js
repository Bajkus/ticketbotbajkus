const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // === /setup ===
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return interaction.reply({ content: '❌ Brak uprawnień.', ephemeral: true });

      const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

      const embed = new EmbedBuilder()
        .setTitle('🎟️ Panel ticketowy')
        .setDescription('Kliknij odpowiedni przycisk, aby otworzyć ticket:')
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

      await interaction.reply({ content: '✅ Panel został utworzony!', ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }

    // === GUZIKI PANELU ===
    if (interaction.isButton()) {
      const ticketType =
        interaction.customId === 'panel_zamowienie'
          ? 'Zamówienie'
          : interaction.customId === 'panel_reklamacja'
          ? 'Reklamacja'
          : null;

      if (!ticketType) return;

      const existing = interaction.guild.channels.cache.find(
        (ch) => ch.topic === `Ticket użytkownika ${interaction.user.id}`
      );

      if (existing)
        return interaction.reply({
          content: `❌ Masz już otwarty ticket: ${existing}`,
          ephemeral: true,
        });

      // === FORMULARZ ===
      const modal = new ModalBuilder()
        .setCustomId(`formularz_${ticketType}`)
        .setTitle(`Formularz: ${ticketType}`);

      const nazwaProduktuInput = new TextInputBuilder()
        .setCustomId('produkt')
        .setLabel('Nazwa produktu')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Np. Klawiatura Razer Huntsman Mini')
        .setRequired(true);

      const iloscInput = new TextInputBuilder()
        .setCustomId('ilosc')
        .setLabel('Ilość produktów')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Np. 2')
        .setRequired(true);

      const metodaPlatnosciInput = new TextInputBuilder()
        .setCustomId('metoda')
        .setLabel('Metoda płatności')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Np. PayPal / Przelew / Blik')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nazwaProduktuInput),
        new ActionRowBuilder().addComponents(iloscInput),
        new ActionRowBuilder().addComponents(metodaPlatnosciInput)
      );

      await interaction.showModal(modal);
    }

    // === WYSYŁKA FORMULARZA ===
    if (interaction.isModalSubmit()) {
      if (!interaction.customId.startsWith('formularz_')) return;

      const typ = interaction.customId.split('_')[1];
      const produkt = interaction.fields.getTextInputValue('produkt');
      const ilosc = interaction.fields.getTextInputValue('ilosc');
      const metoda = interaction.fields.getTextInputValue('metoda');

      const channel = await interaction.guild.channels.create({
        name: `${config.ticketPrefix}${interaction.user.username}`,
        type: ChannelType.GuildText,
        topic: `Ticket użytkownika ${interaction.user.id}`,
        parent: config.ticketCategoryId,
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
        .setDescription(
          `Nowy ticket od <@${interaction.user.id}>\n\n🏷️ **Produkt:** ${produkt}\n📦 **Ilość:** ${ilosc}\n💳 **Metoda płatności:** ${metoda}`
        )
        .setColor('#5865f2')
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ Ticket utworzony pomyślnie: ${channel}`,
        ephemeral: true,
      });
    }
  },
};
