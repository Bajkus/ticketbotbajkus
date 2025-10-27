const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Pobieramy token z ENV
const token = process.env.TOKEN;
if (!token) {
  const token = process.env.TOKEN || config.token;
if (!token) {
  console.error('❌ Brak tokena! Ustaw process.env.TOKEN lub dodaj do config.json.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Ładowanie komend
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Ładowanie eventów
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) client.once(event.name, (...args) => event.execute(...args));
    else client.on(event.name, (...args) => event.execute(...args));
}

// Obsługa komend
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error('Błąd przy komendzie:', err);
        if (!interaction.replied) await interaction.reply({ content: 'Wystąpił błąd.', ephemeral: true });
    }
});

// Logowanie bota
client.once('clientReady', () => {
  console.log(`✅ Bot gotowy! Zalogowano jako ${client.user.tag}`);
})client.login(token).catch(err => {
  console.error('❌ Błąd logowania:', err);
  process.exit(1);
});
