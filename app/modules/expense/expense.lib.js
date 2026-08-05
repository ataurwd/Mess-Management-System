const ExpenseModel = require('./expense.model');
const CategoryModel = require('../category/category.model');
const UserModel = require('../user/user.model');


async function ExpenseDetails(data) {
    if (!data || !data.length) return { data: [], total: 0 };
    const expenseDetails = await Promise.all(data.map(async (item) => {
        const cat = item.categoryId ? await CategoryModel.findById(item.categoryId) : null;
        const usr = item.userId ? await UserModel.findById(item.userId) : null;
        return {
            category: cat ? cat.name : 'N/A',
            username: usr ? usr.username : 'N/A',
            ...item.toObject(),
        };
    }));

    const ExpenseArr = data.map(item => Number(item.amount) || 0);
    const total = ExpenseArr.reduce((sum, expense) => sum + expense, 0);
    return {
        data: expenseDetails,
        total,
    };
}

class ExpenseLib {
    static async addExpense(expenseObject) {
        try {
            if (!expenseObject.categoryId) delete expenseObject.categoryId;
            return await ExpenseModel.create(expenseObject);
        } catch (e) {
            throw e;
        }
    }

    static async getMessExpenses(messId) {
        try {
            const data = await ExpenseModel.find({ messId }).sort({ date: -1 });
            if (data && data.length) {
                return await ExpenseDetails(data);
            }
            return { data: [], total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async totalMessExpense(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const data = await ExpenseModel.find({
                messId,
                date: {
                    $gte: currentMonthFirstDate,
                    $lte: currentMonthLastDate,
                },
            });
            if (data && data.length) {
                return await ExpenseDetails(data);
            }
            return { data: [], total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async totalMealExpense(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const category = await CategoryModel.findOne({
                $and: [{ isMeal: 1 }, { messId }],
            });
            if (!category) {
                return { data: [], total: 0 };
            }
            const data = await ExpenseModel.find({
                categoryId: category._id,
                messId,
                date: {
                    $gte: currentMonthFirstDate,
                    $lte: currentMonthLastDate,
                },
            });
            if (data && data.length) {
                return await ExpenseDetails(data);
            }
            return { data: [], total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async categoryWiseExpense(currentMonthFirstDate, currentMonthLastDate, categoryId) {
        try {
            const data = await ExpenseModel.find({
                categoryId,
                date: {
                    $gte: currentMonthFirstDate,
                    $lte: currentMonthLastDate,
                },
            });

            if (data.length) {
                return await ExpenseDetails(data);
            }
            return { data: 0, total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async updateExpense(expenseId, updateObj) {
        try {
            return await ExpenseModel.findByIdAndUpdate({ _id: expenseId }, updateObj, { new: true });
        } catch (e) {
            throw e;
        }
    }

    static async deleteExpense(expenseId) {
        try {
            return await ExpenseModel.findByIdAndDelete(expenseId);
        } catch (e) {
            throw e;
        }
    }
}


module.exports = ExpenseLib;
