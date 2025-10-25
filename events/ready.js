const chalk = require('chalk');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(chalk.hex('#00FF00')(`Bot gotowy! Zalogowano jako ${client.user.tag}`));
    }
};
