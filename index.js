const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// ✅ Połączenie z MongoDB
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Połączono z MongoDB!'))
  .catch(err => console.error('❌ Błąd połączenia z MongoDB:', err));

// 📁 Ładowanie komend
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// 📁 Ładowanie eventów
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ✅ Logowanie
const token = process.env.TOKEN || config.token;
if (!token) {
  console.error('❌ Brak tokena! Dodaj go do config.json lub zmiennej środowiskowej TOKEN.');
  process.exit(1);
}

client.login(token).then(() => {
  console.log('✅ Bot pomyślnie zalogowany!');
}).catch(err => {
  console.error('❌ Błąd przy logowaniu:', err);
});
