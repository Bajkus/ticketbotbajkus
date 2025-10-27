const {
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ===== Komendy slash =====
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

    // ===== Kliknięcie przycisku (Zamówienie / Reklamacja) =====
    if (interaction.isButton()) {
      const { customId, guild, user } = interaction;

      // tworzenie ticketu przez formularz
      if (['create_ticket_order', 'create_ticket_complaint'].includes(customId)) {
        const modal = new ModalBuilder()
          .setCustomId(`modal_${customId}`)
          .setTitle(customId === 'create_ticket_order' ? '🛒 Formularz zamówienia' : '⚠️ Formularz reklamacji');

        const product = new TextInputBuilder()
          .setCustomId('product')
          .setLabel('Produkt')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Np. Koszulka #123')
          .setRequired(true);

        const quantity = new TextInputBuilder()
          .setCustomId('quantity')
          .setLabel('Ilość')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Np. 2 sztuki')
          .setRequired(true);

        const payment = new TextInputBuilder()
          .setCustomId('payment')
          .setLabel('Metoda płatności')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Np. BLIK, PayPal, Przelew')
          .setRequired(true);


        modal.addComponents(
          new ActionRowBuilder().addComponents(product),
          new ActionRowBuilder().addComponents(quantity),
          new ActionRowBuilder().addComponents(payment),
          new ActionRowBuilder().addComponents(notes)
        );

        await interaction.showModal(modal);
        return;
      }

      // zamykanie ticketa
      if (customId === 'close_ticket') {
        await interaction.reply({
          content: '🗑️ Czy na pewno chcesz zamknąć ten ticket? Kliknij poniżej, aby potwierdzić.',
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('confirm_close_ticket')
                .setLabel('✅ Tak, zamknij')
                .setStyle(ButtonStyle.Danger)
            )
          ],
          ephemeral: true
        });
        return;
      }

      if (customId === 'confirm_close_ticket') {
        await interaction.channel.send('🔒 Ticket zostanie zamknięty za 3 sekundy...');
        setTimeout(() => {
          interaction.channel.delete().catch(() => null);
        }, 3000);
        return;
      }
    }

    // ===== Wysłanie formularza (modal) =====
    if (interaction.isModalSubmit()) {
      const { customId, guild, user } = interaction;
      if (!customId.startsWith('modal_')) return;

      const type = customId === 'modal_create_ticket_order' ? 'zamówienie' : 'reklamację';
      const product = interaction.fields.getTextInputValue('product');
      const quantity = interaction.fields.getTextInputValue('quantity');
      const payment = interaction.fields.getTextInputValue('payment');
      const notes = interaction.fields.getTextInputValue('notes') || 'Brak';

      // sprawdzamy czy user już ma ticket
      const existing = guild.channels.cache.find(c => c.name === `${config.ticketPrefix}${user.username}`);
      if (existing)
        return interaction.reply({
          content: `❌ Masz już otwarty ticket: ${existing}`,
          ephemeral: true
        });

      // tworzymy kanał
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

      // embed podsumowania
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

      const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Zamknij ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `<@${user.id}> | <@&${config.supportRoleId}>`,
        embeds: [embed],
        components: [closeButton]
      });

      await interaction.reply({
        content: `✅ Utworzono ticket: ${ticketChannel}`,
        ephemeral: true
      });
    }
  }
};
