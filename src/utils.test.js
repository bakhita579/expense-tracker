
import { 
    addExpense, 
    updateExpenseCategory, 
    filterExpenses, 
    convertCurrency, 
    calculateTotal 
} from '.src/utils.js';

describe('Expense Tracker Utility Functions', () => {
    
    const mockExpenses = [
        { id: 1, description: 'Lunch', amount: 1000, currency: 'KES', category: 'Food' },
        { id: 2, description: 'Bus Fare', amount: 500, currency: 'KES', category: 'Transport' }
    ];

    const mockRates = {
        'KES': 1,
        'USD': 0.0077,
        'EUR': 0.0071
    };

    test('addExpense adds a new expense immutably using the spread operator', () => {
        const newExpense = { id: 3, description: 'Coffee', amount: 300, currency: 'KES', category: 'Food' };
        const updatedList = addExpense(mockExpenses, newExpense);

        expect(updatedList.length).toBe(3);
        expect(updatedList[2]).toEqual(newExpense);
        expect(mockExpenses.length).toBe(2); // Ensure original array is not mutated
    });

    test('updateExpenseCategory modifies the correct expense category immutably', () => {
        const updatedList = updateExpenseCategory(mockExpenses, 1, 'Dining');

        expect(updatedList[0].category).toBe('Dining');
        expect(mockExpenses[0].category).toBe('Food'); // Ensure original item is not mutated
    });

    test('filterExpenses returns filtered results or all expenses when "All" is selected', () => {
        const foodExpenses = filterExpenses(mockExpenses, 'Food');
        expect(foodExpenses.length).toBe(1);
        expect(foodExpenses[0].description).toBe('Lunch');

        const allExpenses = filterExpenses(mockExpenses, 'All');
        expect(allExpenses.length).toBe(2);
    });

    test('convertCurrency converts amounts accurately between currencies', () => {
        // Same currency conversion
        expect(convertCurrency(500, 'KES', 'KES', mockRates)).toBe(500);

        // Cross-currency conversion (KES to USD)
        const converted = convertCurrency(1000, 'KES', 'USD', mockRates);
        expect(converted).toBeCloseTo(7.7);

        // Fallback for missing rate data
        expect(convertCurrency(100, 'KES', 'XYZ', mockRates)).toBe(100);
    });

    test('calculateTotal computes the sum of expenses converted into home currency', () => {
        // Total of 1000 KES + 500 KES in home currency KES should be 1500
        const totalKES = calculateTotal(mockExpenses, 'KES', mockRates);
        expect(totalKES).toBe(1500);
    });
});