require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')).forEach(file => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
});

// Load events
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).filter(file => file.endsWith('.js')).forEach(file => {
    const event = require(`./events/${file}`);
    if(event.once){
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log(chalk.green('✅ MongoDB connected!')))
.catch(err => console.log(chalk.red('❌ MongoDB connection error:'), err));


// Login
client.login(process.env.TOKEN)
.then(() => console.log(`✅ Bot logged in as ${client.user.tag}`)))
.catch(err => console.log('❌ Discord login error:'), err));
