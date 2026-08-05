const UserModel = require('../user/user.model');

const CategoryModel = require('../category/category.model');

const BalanceModel = require('./balance.model');

const ExpenseLib = require('../expense/expense.lib');

async function Balancedetails(data) {
    if (!data || !data.length) return { data: [], total: 0 };
    const balanceDetails = await Promise.all(data.map(async (item) => {
        const cat = item.categoryId ? await CategoryModel.findById(item.categoryId) : null;
        const usr = item.userId ? await UserModel.findById(item.userId) : null;
        return {
            category: cat ? cat.name : 'General Deposit',
            username: usr ? usr.username : 'N/A',
            ...item.toObject(),
        };
    }));

    const balanceArr = data.map(item => Number(item.amount) || 0);
    const total = balanceArr.reduce((sum, balance) => sum + balance, 0);
    return { data: balanceDetails, total };
}

class BalanceLib {
    static async addBalance(balanceObject) {
        try {
            if (!balanceObject.categoryId) delete balanceObject.categoryId;
            const balance = await BalanceModel.create(balanceObject);
            return { success: true, message: `Added ৳${balance.amount} deposit`, data: balance };
        } catch (e) {
            throw e;
        }
    }

    static async getMessBalances(messId) {
        try {
            const data = await BalanceModel.find({ messId }).sort({ date: -1 });
            if (data && data.length) {
                return await Balancedetails(data);
            }
            return { data: [], total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async userTotalBalance(currentMonthFirstDate, currentMonthLastDate, id) {
        try {
            const data = await BalanceModel.find({
                userId: id,
                date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
            });

            if (data.length) {
                // const balanceDetails = await Promise.all(data.map(async (item) => {
                //   const cat = await CategoryModel.findById(item.categoryId);
                //   const usr = await UserModel.findById(item.userId);
                //   return {
                //     category: cat.name,
                //     username: usr.messusername,
                //     ...item.toObject(),
                //   };
                // }));
                //
                // const balanceArr = data.map(item => item.amount);
                // const total = balanceArr.reduce((sum, balance) => sum + balance);
                // return { data: balanceDetails, total };
                return await Balancedetails(data);
            } return { data: null, total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async userMealBalance(currentMonthFirstDate, currentMonthLastDate, id, messId) {
        try {
            const category = await CategoryModel.findOne({
                $and: [{ isMeal: 1 }, { messId }],
            });
            const data = await BalanceModel.find({
                userId: id,
                categoryId: category._id,
                date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
            });

            if (data.length) {
                // const balanceDetails = await Promise.all(data.map(async (item) => {
                //   const cat = await CategoryModel.findById(item.categoryId);
                //   const usr = await UserModel.findById(item.userId);
                //   return {
                //     category: cat.name,
                //     username: usr.username,
                //     ...item.toObject(),
                //   };
                // }));
                //
                // const balanceArr = data.map(item => item.amount);
                // const total = balanceArr.reduce((sum, balance) => sum + balance);
                // return { data: balanceDetails, total };
                return await Balancedetails(data);
            } return { data: null, total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async totalMessBalance(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const data = await BalanceModel.find({
                messId,
                date: {
                    $gte: currentMonthFirstDate,
                    $lte: currentMonthLastDate,
                },
            });
            if (data.length) {
                return await Balancedetails(data);
            }
            return { data: null, total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async totalMealBalance(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const category = await CategoryModel.findOne({
                $and: [{ isMeal: 1 }, { messId }],
            });
            const data = await BalanceModel.find({
                categoryId: category._id,
                messId,
                date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
            });
            if (data.length) {
                return await Balancedetails(data);
            }
            return { data: null, total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async categoryWiseBalance(currentMonthFirstDate, currentMonthLastDate, categoryId) {
        try {
            const data = await BalanceModel.find({
                categoryId,
                date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
            });
            if (data.length) {
                return await Balancedetails(data);
            }
            return { data: null, total: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async currentAvailableBalance(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            return await Promise.all(
                [
                    this.totalMessBalance(currentMonthFirstDate, currentMonthLastDate, messId),
                    ExpenseLib.totalMessExpense(currentMonthFirstDate, currentMonthLastDate, messId),
                ],
            ).then(result => result[0].total - result[1].total);
        } catch (e) {
            throw e;
        }
    }

    static async updateBalance(balanceId, updateObj) {
        try {
            return await BalanceModel.findByIdAndUpdate({ _id: balanceId }, updateObj, { new: true });
        } catch (e) {
            throw e;
        }
    }

    static async deleteBalance(balanceId) {
        try {
            return await BalanceModel.findByIdAndDelete(balanceId);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = BalanceLib;
