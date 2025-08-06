const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const chatId = process.env.TELEGRAM_CHAT_ID;

// (async () => {
//   const res = await axios.get('https://contract.mexc.com/api/v1/contract/detail');
//   const symbols = res.data.data.map(item => item.symbol);

//   if (!symbols.includes('MYX_USDT')) { 
//     console.log('❌ MYX_USDT нет в списке фьючерсов');
//     return;
//   }

//   const socket = new WebSocket('wss://contract.mexc.com/edge');

//   socket.on('open', () => {
//     console.log('✅ WebSocket подключён');

//     socket.send(JSON.stringify({
//       method: 'sub.deal',
//       param: { symbol: 'MYX_USDT' }
//     }));

//     setInterval(() => {
//       socket.send(JSON.stringify({ method: 'ping' }));
//     }, 15000);
//   });

//   socket.on('message', async(data) => {
//     try {
//       const msg = await JSON.parse(data);
//       if (msg.channel === 'push.deal' && msg.symbol === 'MYX_USDT') {
//         const trade = msg.data;
//         console.log(`💰 Сделка: ${trade.p} на ${msg.symbol}`);
//         if(trade.p < 1.5){
            // const message = `🚨 Объёмный всплеск на ${msg.symbol}
            // Сигнал: <b>🚀 Цена выше 0.004: ${trade.p}</b>
            // <a href="https://www.mexc.com/en-GB/exchange/${msg.symbol}">Открыть ${msg.symbol}</a>`;

            // bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
//         }
//       }
//     } catch (e) {
//       console.error('Ошибка парсинга:', e.message);
//     }
//   });
// })();


const app = express();
app.use(cors());
app.use(express.json());

async function fetchMyxPrice() {
  try {
    const resp = await axios.get('https://api.mexc.com/api/v3/ticker/price', {
      params: { symbol: 'MYXUSDT' }
    });
    const pr = 1.5
    if(resp.data.price < pr) {
      const message = `🚨 Объёмный всплеск на ${resp.data.symbol}
      Сигнал: <b>🚀 Цена nije ${pr}: ${resp.data.price}</b>
      <a href="https://www.mexc.com/en-GB/exchange/${resp.data.symbol}">Открыть ${resp.data.symbol}</a>`;
  
      bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }
    return {Symbol: resp.data.symbol, Price: resp.data.price};
  } catch (err) {
    console.error('Error fetching MYX price:', err.response?.data ?? err.message);
  }
}

setInterval(async() => {
  fetchMyxPrice().catch(err => console.error('Error in interval:', err));
  await axios.get('https://token-get-price.onrender.com', {
    params: { symbol: 'MYXUSDT' }
  });
}, 15000);

app.get('/', async(req, res) => { 
  const data = await fetchMyxPrice();   
  if (!data) {
    return res.status(500).send('Error fetching MYX price');
  }
  res.send(`
      <html>
          <head><title>My Page</title></head>
          <body>
              <h1>Symbol:${data.Symbol}</h1>
              <p>Price: ${data.Price}</p>
              <a href="https://www.mexc.com/en-GB/exchange/MYX_USDT">Link</a>
          </body>
      </html>
  `);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

