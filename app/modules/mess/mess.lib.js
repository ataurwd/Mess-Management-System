const BalanceLib = require('../balance/balance.lib');
const MealLib = require('../meal/meal.lib');
const ExpenseLib = require('../expense/expense.lib');

class MessLib {
    static async userSummary(currentMonthFirstDate, currentMonthLastDate, userId, messId) {
        try {
            const totalSavingsObj = await BalanceLib.userMealBalance(currentMonthFirstDate, currentMonthLastDate, userId, messId);
            const meal = await MealLib.userWiseMeal(currentMonthFirstDate, currentMonthLastDate, userId);
            const mealRateVal = await MealLib.mealRateInMonth(currentMonthFirstDate, currentMonthLastDate, messId);

            const savings = (totalSavingsObj && typeof totalSavingsObj.total === 'number') ? totalSavingsObj.total : 0;
            const mealsCount = (meal && typeof meal.meals === 'number') ? meal.meals : 0;
            const mealRate = typeof mealRateVal === 'number' && !isNaN(mealRateVal) ? mealRateVal : 0;

            const totalExpense = mealRate * mealsCount;
            const balanceStatus = savings - totalExpense;
            return {
                totalSavings: savings,
                totalExpense: totalExpense.toFixed(2),
                balanceStatus: balanceStatus.toFixed(2),
                meals: mealsCount,
            };
        } catch (e) {
            throw e;
        }
    }

    static async messSummary(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const totalSavingsObj = await BalanceLib.totalMealBalance(currentMonthFirstDate, currentMonthLastDate, messId);
            const totalExpenseObj = await ExpenseLib.totalMealExpense(currentMonthFirstDate, currentMonthLastDate, messId);
            const totalMealsObj = await MealLib.totalMealInMonth(currentMonthFirstDate, currentMonthLastDate, messId);
            const mealRateVal = await MealLib.mealRateInMonth(currentMonthFirstDate, currentMonthLastDate, messId);

            const savings = (totalSavingsObj && typeof totalSavingsObj.total === 'number') ? totalSavingsObj.total : 0;
            const expense = (totalExpenseObj && typeof totalExpenseObj.total === 'number') ? totalExpenseObj.total : 0;
            const mealsCount = (totalMealsObj && typeof totalMealsObj.meals === 'number') ? totalMealsObj.meals : 0;
            const mealRate = typeof mealRateVal === 'number' && !isNaN(mealRateVal) ? mealRateVal : 0;

            const balanceStatus = savings - expense;
            return {
                totalSavings: savings,
                totalExpense: expense,
                balanceStatus: balanceStatus.toFixed(2),
                totalMeals: mealsCount,
                mealRate: mealRate.toFixed(2),
            };
        } catch (e) {
            throw e;
        }
    }
}
module.exports = MessLib;
