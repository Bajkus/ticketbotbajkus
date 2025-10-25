const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

// Tworzenie klienta
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Kolekcja komend
client.commands = new Collection();

// Ładowanie komend z folderu ./commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// Rejestracja komend guild (natychmiast widoczne na serwerze)
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔄 Rejestracja ${commands.length} komend na serwerze...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Komendy zostały zarejestrowane na serwerze.');
    } catch (error) {
        console.error(error);
    }
})();

// Event ready
client.once('ready', () => {
    console.log(`✅ Bot gotowy! Zalogowano jako ${client.user.tag}`);
});

// Event interactionCreate
client.on('interactionCreate', async interaction => {
    require('./events/interactionCreate').execute(interaction);
});

// Logowanie bota
client.login(process.env.TOKEN);
