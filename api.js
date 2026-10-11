async function convertMoney(amount, from, to) {
  const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;
  const response = await fetch(url);
  const data = await response.json();
  
  return data.rates[to];
}

// Example usage: Convert $100 USD to EUR
convertMoney(100, "USD", "EUR").then(result => {
  console.log(`Converted Amount: €${result}`);
});