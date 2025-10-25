module.exports = {
    name: 'clientReady', // v15+ zgodnie z deprecacją
    once: true,
    execute(client) {
        console.log(`✅ Bot gotowy! Zalogowano jako ${client.user.tag}`);
    }
};
