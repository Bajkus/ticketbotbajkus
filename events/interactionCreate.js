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
    // Komendy slash
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        if (!interaction.replied)
          await interaction.reply({ content: '❌ Wystąpił błąd przy wykonywaniu komendy.', ephemeral: true });
      }
    }

    // Obsługa przycisków
    if (interaction.isButton()) {
      await interaction.deferReply({ ephemeral: true });

      let ticketType = 'ticket';
      if (interaction.customId === 'create_ticket_order') ticketType = 'zamowienie';
      if (interaction.customId === 'create_ticket_complaint') ticketType = 'reklamacja';

      const existing = interaction.guild.channels.cache.find(c => c.name === `${config.ticketPrefix}${interaction.user.username}`);
      if (existing)
        return interaction.editReply({ content: `❌ Masz już otwarty ticket: ${existing}.` });

      const ticketChannel = await interaction.guild.channels.create({
        name: `${config.ticketPrefix}${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: config.ticketCategoryId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'AttachFiles'] },
          { id: config.supportRoleId, allow: ['ViewChannel', 'SendMessages'] }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎟️ Ticket — ${ticketType}`)
        .setDescription('Witaj! Proszę wypełnij poniższy formularz:')
        .setColor('#00AAFF');

      // Modal (formularz)
      const modal = new ModalBuilder()
        .setCustomId(`ticket_form_${ticketType}`)
        .setTitle(`Formularz ${ticketType}`);

      const q1 = new TextInputBuilder()
        .setCustomId('order_details')
        .setLabel('Opisz szczegóły (np. produkt, problem, ilość itp.)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const q2 = new TextInputBuilder()
        .setCustomId('payment_method')
        .setLabel('Metoda płatności (np. Blik, PayPal)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(q1);
      const row2 = new ActionRowBuilder().addComponents(q2);
      modal.addComponents(row1, row2);

      await interaction.editReply({ content: `✅ Ticket został utworzony: ${ticketChannel}` });
      await ticketChannel.send({ embeds: [embed] });
      await interaction.showModal(modal);
    }

    // Obsługa modali
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;
      if (customId.startsWith('ticket_form_')) {
        const details = interaction.fields.getTextInputValue('order_details');
        const payment = interaction.fields.getTextInputValue('payment_method');

        const summary = new EmbedBuilder()
          .setTitle('📝 Formularz zamówienia')
          .addFields(
            { name: 'Szczegóły:', value: details },
            { name: 'Metoda płatności:', value: payment }
          )
          .setColor('#00FF99');

        await interaction.reply({ content: '✅ Formularz został zapisany!', ephemeral: true });
        await interaction.channel.send({ embeds: [summary] });
      }
    }
  }
};
