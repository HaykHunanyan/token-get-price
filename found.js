import axios from 'axios';

async function getFundingRates() {
  try {
    const resp = await axios.get('https://contract.mexc.com/api/v1/contract/funding_rate');
    
    resp.data.data.forEach(item => {       
        if(item.fundingRate*100 >= 2 || item.fundingRate*100 <= -2) {
            console.log(`
                🔹 Symbol: ${item.symbol}
                   Funding Rate: ${item.fundingRate*100}
                   Next Funding Time: ${new Date(item.nextSettleTime).toLocaleString()}
                   Countdown (сек.): ${(item.nextSettleTime - Date.now()) / 1000}
                      `);
        }
    });

  } catch (err) {
    console.error('❌ Ошибка при получении Funding Rate:', err.message);
  }
}

getFundingRates();
