const chalk = require('chalk');

module.exports = {
    name: 'clientReady', // zamiast 'ready'
    once: true,
    execute(client) {
        console.log(`✅ Bot gotowy! Zalogowano jako ${client.user.tag}`);
    }
};
