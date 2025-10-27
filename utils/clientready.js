module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Bot gotowy! Zalogowano jako ${client.user.tag}`);
  }
};
