const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
await interaction.reply({ content: 'Rozpoczynam formularz opinii — proszę odpowiedzieć na pytania (1-5).', ephemeral: true });
try {
const filter = m => !m.author.bot;
const ask = async (question) => {
await channel.send(question);
const collected = await channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] });
return collected.first();
};


const waitMsg = await ask('Oceń czas oczekiwania (1-5):');
const wait = parseInt(waitMsg.content) || 0;
const qualityMsg = await ask('Oceń jakość produktu (1-5):');
const quality = parseInt(qualityMsg.content) || 0;
const transMsg = await ask('Oceń przebieg transakcji (1-5):');
const transaction = parseInt(transMsg.content) || 0;
await channel.send('Dodatkowy komentarz (opcjonalnie) — napisz wiadomość lub wpisz `-` aby pominąć.');
const commMsg = await ask('Komentarz:');
const comment = commMsg.content === '-' ? '' : commMsg.content;


// Save review
const author = waitMsg.author;
const review = new Review({ userId: author.id, userTag: `${author.username}#${author.discriminator}`, waitTime: wait, quality, transaction, comment });
await review.save().catch(console.error);


// Send embed to review channel
const embed = new EmbedBuilder()
.setTitle('Nowa opinia')
.setDescription(comment || 'Brak komentarza')
.addFields(
{ name: 'Użytkownik', value: `<@${author.id}>`, inline: true },
{ name: 'Czas oczekiwania', value: `${'★'.repeat(Math.max(0, Math.min(5, wait)))} (${wait}/5)`, inline: true },
{ name: 'Jakość produktu', value: `${'★'.repeat(Math.max(0, Math.min(5, quality)))} (${quality}/5)`, inline: true },
{ name: 'Przebieg transakcji', value: `${'★'.repeat(Math.max(0, Math.min(5, transaction)))} (${transaction}/5)`, inline: true }
)
.setFooter({ text: `Opinia od ${author.tag}` })
.setTimestamp();


const reviewChannel = interaction.guild.channels.cache.get(config.reviewChannelId);
if (reviewChannel) await reviewChannel.send({ embeds: [embed] });


await channel.send('Dziękujemy za opinię! Ticket zostanie zamknięty za 5 sekund.');
setTimeout(() => channel.delete().catch(()=>{}), 5000);
} catch (e) {
console.error(e);
await channel.send('Formularz opinii nie został wypełniony na czas — ticket pozostanie otwarty.');
}
}
}


if (interaction.isChatInputCommand()) {
const command = client.commands.get(interaction.commandName);
if (!command) return;
try {
await command.execute(interaction);
} catch (e) {
console.error(e);
await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania komendy.', ephemeral: true });
}
}
}
};
