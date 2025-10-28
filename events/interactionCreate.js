const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

const config = require('../config.json');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {

    // -----------------------------
    // Obsługa kliknięcia guzika panelu
    // -----------------------------
    if (interaction.isButton()) {
      if (interaction.customId === 'panel_zamowienie' || interaction.customId === 'panel_reklamacja') {

        // Tworzymy modal
        const modal = new ModalBuilder()
          .setCustomId(`ticket_modal_${interaction.customId}`)
          .setTitle(interaction.customId === 'panel_zamowienie' ? 'Zamówienie' : 'Reklamacja');

        const productInput = new TextInputBuilder()
          .setCustomId('produkt')
          .setLabel('Nazwa produktu')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const quantityInput = new TextInputBuilder()
          .setCustomId('ilosc')
          .setLabel('Ilość')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const paymentInput = new TextInputBuilder()
          .setCustomId('platnosc')
          .setLabel('Metoda płatności')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(productInput),
          new ActionRowBuilder().addComponents(quantityInput),
          new ActionRowBuilder().addComponents(paymentInput)
        );

        return interaction.showModal(modal);
      }
    }

    // -----------------------------
    // Obsługa zatwierdzenia modala
    // -----------------------------
    if (interaction.isModalSubmit()) {

      if (!interaction.customId.startsWith('ticket_modal_')) return;

      // Logi debugowe
      console.log('Modal zatwierdzony przez:', interaction.user.tag);

      const produkt = interaction.fields.getTextInputValue('produkt');
      const ilosc = interaction.fields.getTextInputValue('ilosc');
      const platnosc = interaction.fields.getTextInputValue('platnosc');

      // Sprawdzenie guild i kategorii
      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: '❌ Ta komenda działa tylko na serwerze.', ephemeral: true });

      const categoryId = config.ticketCategoryId;
      const supportRoleId = config.supportRoleId;
      if (!categoryId || !supportRoleId) {
        console.error('Brak ID kategorii lub roli support w config.json');
        return interaction.reply({ content: '❌ Niepoprawna konfiguracja bota.', ephemeral: true });
      }

      // Tworzenie kanału ticketowego
      let ticketChannel;
      try {
        ticketChannel = await guild.channels.create({
          name: `${config.ticketPrefix}${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: categoryId,
          topic: `Ticket użytkownika ${interaction.user.tag}`,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
          ]
        });
      } catch (err) {
        console.error('Błąd przy tworzeniu kanału ticketa:', err);
        return interaction.reply({ content: '❌ Nie udało się utworzyć kanału ticketa. Sprawdź uprawnienia i ID w config.', ephemeral: true });
      }

      // Wysłanie embedu z formularzem do nowego kanału
      const embed = new EmbedBuilder()
        .setTitle(interaction.customId.includes('zamowienie') ? 'Nowe zamówienie' : 'Nowa reklamacja')
        .addFields(
          { name: 'Użytkownik', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Produkt', value: produkt, inline: true },
          { name: 'Ilość', value: ilosc, inline: true },
          { name: 'Metoda płatności', value: platnosc, inline: true }
        )
        .setTimestamp()
        .setColor('Green');

      await ticketChannel.send({ content: `Witaj <@${interaction.user.id}>! Twój ticket został utworzony.`, embeds: [embed] });

      // Odpowiedź dla użytkownika
      await interaction.reply({ content: `✅ Twój ticket został utworzony: ${ticketChannel}`, ephemeral: true });
    }
  }
};
