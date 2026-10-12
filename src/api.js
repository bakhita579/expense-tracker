// src/api.js

export async function fetchExchangeRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.rates) {
            return data.rates;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error("Failed to fetch live exchange rates, using fallback rates:", error.message);
        
        return { USD: 1, EUR: 0.92, GBP: 0.79, KES: 129.5 };
    }
}