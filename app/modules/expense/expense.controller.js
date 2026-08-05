const response = require('../../../helper/response');
const ExpenseLib = require('./expense.lib');

const date = new Date(); const y = date.getFullYear(); const
    m = date.getMonth();
const currentMonthFirstDate = new Date(y, m, 1).toISOString();
const currentMonthLastDate = new Date(y, m + 1, 0).toISOString();

class ExpenseController {
    static async addExpense(req, res) {
        try {
            const expenseObject = { ...req.body };
            expenseObject.messId = req.auth.messId;
            if (expenseObject.date) {
                expenseObject.date = new Date(expenseObject.date).toISOString();
            } else {
                expenseObject.date = new Date().toISOString();
            }
            expenseObject.summary = req.body.summary || req.body.itemDetails || 'General Expense';
            if (!expenseObject.categoryId || expenseObject.categoryId === '') {
                delete expenseObject.categoryId;
            }

            const result = await ExpenseLib.addExpense(expenseObject);
            return res.status(200).json(response.single(true, `Added ৳${result.amount} expense`, result));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async getMessExpenses(req, res) {
        try {
            const { messId } = req.auth;
            const expense = await ExpenseLib.getMessExpenses(messId);
            return res.status(200).json(response.single(true, 'Mess Expenses', expense.data || []));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async totalMessExpense(req, res) {
        try {
            const expense = await ExpenseLib.totalMessExpense(currentMonthFirstDate, currentMonthLastDate, req.auth.messId);
            return res.status(200).json(response.single(true, `Total expense of mess: ${expense.total} `, expense));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async totalMealExpense(req, res) {
        try {
            const expense = await ExpenseLib.totalMealExpense(currentMonthFirstDate, currentMonthLastDate, req.auth.messId);
            return res.status(200).json(response.single(true, `Total expense of mess: ${expense.total} `, expense));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async categoryWiseExpense(req, res) {
        try {
            const expense = await ExpenseLib.categoryWiseExpense(currentMonthFirstDate, currentMonthLastDate, req.params.categoryId);
            return res.status(200).json(response.single(true, `Expense amount of the categories is: ${expense.total} `, expense));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async updateExpense(req, res) {
        try {
            const expense = await ExpenseLib.updateExpense(req.params.expenseId, req.body);
            return res.status(200).json(response.single(true, `Your updated expense is: ${expense.amount} `, expense));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async deleteExpense(req, res) {
        try {
            await ExpenseLib.deleteExpense(req.params.expenseId);
            return res.status(200).json(response.single(true, 'Delete expense successfully'));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }
}

module.exports = ExpenseController;
