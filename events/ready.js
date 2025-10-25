const chalk = require('chalk');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('#00FF00')(`Bot gotowy! Zalogowano jako ${client.user.tag}`));
    }
};
