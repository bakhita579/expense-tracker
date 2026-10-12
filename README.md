# expense-tracker
People who travel, freelance for international clients or shop from foreign stores end up paying in many currencies, and it becomes hard to answer a simple question: *how much have I actually spent?* This app lets you log each expense in the currency you paid in — USD, EUR, GBP, KES and more — and instantly see every item and your running total converted into one home currency you understand, using live exchange rates from a public REST API.
# live demo 
https://bakhita579.github.io/expense-tracker/
# features list
- Add Expense Form: Captures description, amount, original currency, and category.
- ​Live Currency Conversion: Automatically converts all logged expenses to your chosen home currency.
- ​Real-time Running Total: Automatically calculates and updates the total sum as items are added or removed.
- ​Category Filtering: Filter displayed expenses instantly by specific categories (Food, Transport, Shopping, Accommodation, Other).
- ​Immutable State Updates: Leverages JavaScript ES6 spread operators to update state cleanly without direct mutation.
- ​Robust Error Handling: Gracefully falls back to static rates if the live network fetch fail
# Technoligies used
HTML,CSSAdd Expense Form: Captures description, amount, original currency, and category.
​Live Currency Conversion: Automatically converts all logged expenses to your chosen home currency.
​Real-time Running Total: Automatically calculates and updates the total sum as items are added or removed.
​Category Filtering: Filter displayed expenses instantly by specific categories (Food, Transport, Shopping, Accommodation, Other).
​Immutable State Updates: Leverages JavaScript ES6 spread operators to update state cleanly without direct mutation.
​Robust Error Handling: Gracefully falls back to static rates if the live network fetch fail JS an the github actions
# technologies used
- HTML & CSS- clean, responsive layout styled with CSS
- JavaScript - modular architure split across src/ files using import and export 
- REST API - exchange rate API for live currency exchange rates.
# How to run locally
1. clone the repository 
``` 
git clone https://github.com/bakhita579/expense-tracker
```
2. Install dependecies 
```
npm install
```
3.  Run linter 
```
npm run lint 
```
4. run unit test 
``` 
npm test 
```
5. Run the application locally
open index.html using a live server.
# What I'd improve
With more time, I would add data persistence using localStorage so that user expenses are saved across browser refreshes. Additionally, I would incorporate graphical charts (using a library like Chart.js) to visualize spending breakdowns by category, and add support for historical exchange rate tracking.