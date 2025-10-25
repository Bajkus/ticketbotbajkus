require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');
const chalk = require('chalk');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
client.commands = new Collection();


// Load commands
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).forEach(file => {
const cmd = require(`./commands/${file}`);
client.commands.set(cmd.data.name, cmd);
commands.push(cmd.data.toJSON());
});


// Load events
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).forEach(file => {
const evt = require(`./events/${file}`);
if (evt.once) client.once(evt.name, (...args) => evt.execute(...args, client));
else client.on(evt.name, (...args) => evt.execute(...args, client));
});


// Register slash commands to guild (fast deploy while testing)
(async () => {
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
try {
console.log(chalk.yellow('Rejestruję komendy...'));
await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
console.log(chalk.green('Komendy zarejestrowane.'));
} catch (e) {
console.error(e);
}
})();


// Connect mongoose
mongoose.connect(process.env.MONGO_URI, { keepAlive: true })
.then(() => console.log(chalk.green('Połączono z MongoDB')))
.catch(err => console.error('MongoDB error:', err));


// Login
client.login(process.env.TOKEN);
