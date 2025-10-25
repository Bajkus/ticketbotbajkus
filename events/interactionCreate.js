module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if(!interaction.isCommand()) return;
        const command = client.commands.get(interaction.commandName);
        if(!command) return;
        try { await command.execute(interaction); }
        catch(err){ console.error(err); await interaction.reply({ content: 'Błąd podczas wykonywania komendy!', ephemeral: true }); }
    }
};