module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot gotowy! Zalogowano jako ${client.user.tag}`);
    }
};