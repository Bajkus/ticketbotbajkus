const {
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // --- Komendy slash ---
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        if (!interaction.replied)
          await interaction.reply({
            content: '❌ Wystąpił błąd przy wykonywaniu komendy.',
            ephemeral: true
          });
      }
      return;
    }

    // --- Główne przyciski (zamówienie / reklamacja) ---
    if (interaction.isButton()) {
      const { customId, guild, user } = interaction;

      if (!['create_ticket_order', 'create_ticket_complaint'].includes(customId)) return;

      // tworzymy modal
      const modal = new ModalBuilder()
        .setCustomId(`modal_${customId}`)
        .setTitle(customId === 'create_ticket_order' ? '🛒 Formularz zamówienia' : '⚠️ Formularz reklamacji');

      const productInput = new TextInputBuilder()
        .setCustomId('product')
        .setLabel('Produkt')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Wpisz nazwę produktu...')
        .setRequired(true);

      const quantityInput = new TextInputBuilder()
        .setCustomId('quantity')
        .setLabel('Ilość')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Np. 2 sztuki')
        .setRequired(true);

      const paymentInput = new TextInputBuilder()
        .setCustomId('payment')
        .setLabel('Metoda płatności')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Np. Blik, przelew, PayPal')
        .setRequired(true);

      const notesInput = new TextInputBuilder()
        .setCustomId('notes')
        .setLabel('Dodatkowe informacje')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Np. adres wysyłki, uwagi, rozmiar...')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(productInput),
        new ActionRowBuilder().addComponents(quantityInput),
        new ActionRowBuilder().addComponents(paymentInput),
        new ActionRowBuilder().addComponents(notesInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // --- Po wysłaniu modala ---
    if (interaction.isModalSubmit()) {
      const { customId, guild, user } = interaction;
      if (!customId.startsWith('modal_')) return;

      const type = customId === 'modal_create_ticket_order' ? 'zamówienie' : 'reklamację';
      const product = interaction.fields.getTextInputValue('product');
      const quantity = interaction.fields.getTextInputValue('quantity');
      const payment = interaction.fields.getTextInputValue('payment');
      const notes = interaction.fields.getTextInputValue('notes') || 'Brak';

      // Tworzymy kanał ticketowy
      const existing = guild.channels.cache.find(c => c.name === `${config.ticketPrefix}${user.username}`);
      if (existing)
        return interaction.reply({
          content: `❌ Masz już otwarty ticket: ${existing}`,
          ephemeral: true
        });

      const ticketChannel = await guild.channels.create({
        name: `${config.ticketPrefix}${user.username}`,
        type: ChannelType.GuildText,
        parent: config.ticketCategoryId,
        permissionOverwrites: [
          { id: guild.id, deny: ['ViewChannel'] },
          { id: user.id, allow: ['ViewChannel', 'SendMessages', 'AttachFiles'] },
          { id: config.supportRoleId, allow: ['ViewChannel', 'SendMessages'] }
        ]
      });

      // Embed z danymi formularza
      const embed = new EmbedBuilder()
        .setTitle(`📩 Nowe ${type}`)
        .setColor(customId === 'modal_create_ticket_order' ? '#00AAFF' : '#FFAA00')
        .addFields(
          { name: '🧾 Produkt', value: product, inline: false },
          { name: '📦 Ilość', value: quantity, inline: true },
          { name: '💳 Płatność', value: payment, inline: true },
          { name: '🗒️ Uwagi', value: notes, inline: false }
        )
        .setFooter({ text: `Użytkownik: ${user.tag}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();

      await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed] });

      await interaction.reply({
        content: `✅ Utworzono ticket: ${ticketChannel}`,
        ephemeral: true
      });
    }
  }
};
