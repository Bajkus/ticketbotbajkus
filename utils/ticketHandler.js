const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const payment = await ask('3) Metoda płatności (np. PayPal / Przelew / Blik)?');


const order = new Order({ userId: user.id, userTag: `${user.username}#${user.discriminator}`, type: 'zamowienie', product, quantity, payment });
await order.save().catch(console.error);


const summary = new (require('discord.js')).EmbedBuilder()
.setTitle('Podsumowanie zamówienia')
.addFields(
{ name: 'Użytkownik', value: `<@${user.id}>`, inline: true },
{ name: 'Produkt', value: product || '—', inline: true },
{ name: 'Ilość', value: String(quantity || '—'), inline: true },
{ name: 'Płatność', value: payment || '—', inline: true }
)
.setFooter({ text: 'Gdy chcesz zamknąć ticket, kliknij przycisk Zamknij ticket' });


await channel.send({ embeds: [summary] });
} catch (e) {
if (e.message !== 'no_response') console.error(e);
}
}


async function askComplaintQuestions(channel, user, client) {
const filter = m => m.author.id === user.id;
const ask = async (question, time = 120000) => {
await channel.send(question);
try {
const collected = await channel.awaitMessages({ filter, max: 1, time, errors: ['time'] });
return collected.first().content;
} catch (e) {
await channel.send('Nie otrzymałem odpowiedzi — ticket zostanie zamknięty z powodu braku aktywności.');
setTimeout(() => channel.delete().catch(()=>{}), 5000);
throw new Error('no_response');
}
};


try {
const subject = await ask('Czego dotyczy reklamacja?');
const desc = await ask('Opisz problem / załącz dowód (jeśli możesz).');


const order = new Order({ userId: user.id, userTag: `${user.username}#${user.discriminator}`, type: 'reklamacja', description: `${subject}\n${desc}` });
await order.save().catch(console.error);


const summary = new (require('discord.js')).EmbedBuilder()
.setTitle('Podsumowanie reklamacji')
.setDescription(desc || 'Brak opisu')
.addFields({ name: 'Temat', value: subject || '—' })
.setFooter({ text: 'Gdy chcesz zamknąć ticket, kliknij przycisk Zamknij ticket' });


await channel.send({ embeds: [summary] });
} catch (e) {
if (e.message !== 'no_response') console.error(e);
}
}
