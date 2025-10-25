# Discord Ticket & Review Bot


## Setup
1. Skopiuj pliki do folderu projektu.
2. Stwórz plik `.env` z następującymi wartościami:


```
TOKEN=your_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
MONGO_URI=your_mongo_uri
```


3. W `config.json` uzupełnij `supportRoleId`, `reviewChannelId` i (opcjonalnie) `ticketCategoryId`.
4. Zainstaluj zależności:


```
npm install
```


5. Uruchom bota:


```
npm start
```


## Komendy
- `/setup` — tworzy panel ticketowy (wymaga Manage Guild)
- `/statystyki` — statystyki (dostępne dla roli support lub Manage Guild)
- `/backup` — wyślij wszystkie opinie w formie embedów (rola support lub Manage Guild)


## Przypisy
- Bot w trakcie tworzenia ticketów prosi użytkownika o odpowiedzi w kanale ticketowym.
- Zamknięcie ticketu następuje przez kliknięcie przycisku "Zamknij ticket" i wypełnienie formularza opinii.
