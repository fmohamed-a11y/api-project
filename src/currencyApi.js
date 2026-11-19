const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const ONE_DAY = 24 * 60 * 60 * 1000;

let cachedRates = null;
let cachedAt =0;

async function getRates() {
    if (cachedRates && Date.now() - cachedAt < ONE_DAY) {
        return cachedRates;
    }
    const response = await fetch(RATES_URL, {signal: AbortSignal.timeout(10000) });
 if (!response.ok){
    throw new Error (`Rates service returned status ${ response.status}`);
 }   
 const body = await response.json();
 if (body.result !== 'success' || !body.rates) {
    throw new Error('Rates services sent an unexpected answer');
 }

 cachedRates = body.rates;
 cachedAt = Date.now();
 return cachedRates;
}
module.exports = { getRates };