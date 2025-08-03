const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const chatId = process.env.TELEGRAM_CHAT_ID;

(async () => {
  const res = await axios.get('https://contract.mexc.com/api/v1/contract/detail');
  const symbols = res.data.data.map(item => item.symbol);

  if (!symbols.includes('COS_USDT')) {
    console.log('❌ COS_USDT нет в списке фьючерсов');
    return;
  }

  const socket = new WebSocket('wss://contract.mexc.com/edge');

  socket.on('open', () => {
    console.log('✅ WebSocket подключён');

    socket.send(JSON.stringify({
      method: 'sub.deal',
      param: { symbol: 'COS_USDT' }
    }));

    setInterval(() => {
      socket.send(JSON.stringify({ method: 'ping' }));
    }, 15000);
  });

  socket.on('message', async(data) => {
    try {
      const msg = await JSON.parse(data);
      if (msg.channel === 'push.deal' && msg.symbol === 'COS_USDT') {
        const trade = msg.data;
        if(trade.p > 0.004){
            const message = `🚨 Объёмный всплеск на ${msg.symbol}
            Сигнал: <b>🚀 Цена выше 0.004: ${trade.p}</b>
            <a href="https://www.mexc.com/en-GB/exchange/${msg.symbol}">Открыть ${msg.symbol}</a>`;

            bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        }
      }
    } catch (e) {
      console.error('Ошибка парсинга:', e.message);
    }
  });
})();


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {    
  res.send(`
      <html>
          <head><title>My Page</title></head>
          <body>
              <h1>Welcome to My API</h1>
              <p>This is an HTML response.</p>
          </body>
      </html>
  `);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
