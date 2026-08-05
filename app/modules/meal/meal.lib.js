const MealModel = require('./meal.model');
const UserModel = require('../user/user.model');
const ExpenseLib = require('../expense/expense.lib');

class MealLib {
    static async addMeal(mealObject) {
        try {
            return await MealModel.create(mealObject);
        } catch (e) {
            throw e;
        }
    }

    static async updateMeal(mealId, updateObj) {
        try {
            return await MealModel.findByIdAndUpdate({ _id: mealId }, updateObj, { new: true });
        } catch (e) {
            throw e;
        }
    }

    static async getMessMeals(messId) {
        try {
            const data = await MealModel.find({ messId }).sort({ date: -1 });
            if (data && data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = item.userId ? await UserModel.findById(item.userId) : null;
                    return {
                        username: usr ? usr.username : 'N/A',
                        ...item.toObject(),
                    };
                }));
                return { data: mealDetails };
            }
            return { data: [] };
        } catch (e) {
            throw e;
        }
    }

    static async deleteMeal(mealId) {
        try {
            return await MealModel.findByIdAndDelete(mealId);
        } catch (e) {
            throw e;
        }
    }

    static async totalMealInMonth(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            const data = await MealModel.find(
                {
                    messId,
                    date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
                },
            );

            if (data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = await UserModel.findById(item.userId);
                    return {
                        username: usr.username,
                        ...item.toObject(),
                    };
                }));

                const MealArr = data.map(item => item.numberOfMeal);
                const meals = MealArr.reduce((sum, meal) => sum + meal);
                return { data: mealDetails, meals };
            } return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }


    static async totalMeal(currentMonth, currentMonthLastDate, messId) {
        try {
            const data = await MealModel.find(
                {
                    messId,
                    date: { $gte: currentMonth, $lte: currentMonthLastDate },
                },
            );

            if (data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = await UserModel.findById(item.userId);
                    return {
                        username: usr.username,
                        ...item.toObject(),
                    };
                }));
                const MealArr = data.map(item => item.numberOfMeal);
                const result = MealArr.reduce((sum, meal) => sum + meal);
                return { data: mealDetails, meals: result };
            }
            return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }


    static async currentMeal(currentMonth, currentMonthLastDate, messId) {
        try {
            const data = await MealModel.find(
                {
                    messId,
                    date: { $gte: currentMonth, $lte: currentMonthLastDate },
                },
            );
            if (data.length) {
                const mealDetails = await Promise.all(data.map(async (item) => {
                    const usr = await UserModel.findById(item.userId);
                    return {
                        username: usr.username,
                        ...item.toObject(),
                    };
                }));

                const MealArr = data.map(item => item.numberOfMeal);
                const result = MealArr.reduce((sum, meal) => sum + meal);
                return { data: mealDetails, meals: result };
            }
            return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }

    static async userWiseMeal(currentMonthFirstDate, currentMonthLastDate, userId) {
        try {
            const data = await MealModel.find({
                userId,
                date: { $gte: currentMonthFirstDate, $lte: currentMonthLastDate },
            });

            if (data.length) {
                const MealArr = data.map(item => item.numberOfMeal);
                const result = MealArr.reduce((sum, meal) => sum + meal);
                return { data, meals: result };
            }
            return { data: null, meals: 0 };
        } catch (e) {
            throw e;
        }
    }


    static async mealRateInMonth(currentMonthFirstDate, currentMonthLastDate, messId) {
        try {
            return await Promise.all(
                [
                    ExpenseLib.totalMealExpense(currentMonthFirstDate, currentMonthLastDate, messId),
                    MealLib.totalMealInMonth(currentMonthFirstDate, currentMonthLastDate, messId),
                ],
            ).then(result => {
                const totalExpense = (result[0] && typeof result[0].total === 'number') ? result[0].total : 0;
                const totalMeals = (result[1] && typeof result[1].meals === 'number') ? result[1].meals : 0;
                if (!totalMeals || totalMeals === 0) return 0;
                return totalExpense / totalMeals;
            });
        } catch (e) {
            throw e;
        }
    }


    static async mealRate(messId) {
        try {
            return await Promise.all(
                [
                    ExpenseLib.totalMessExpense(messId),
                    MealLib.totalMeal(messId),
                ],
            ).then(result => {
                const totalExpense = (result[0] && typeof result[0].total === 'number') ? result[0].total : ((typeof result[0] === 'number') ? result[0] : 0);
                const totalMeals = (result[1] && typeof result[1].meals === 'number') ? result[1].meals : ((typeof result[1] === 'number') ? result[1] : 0);
                if (!totalMeals || totalMeals === 0) return 0;
                return totalExpense / totalMeals;
            });
        } catch (e) {
            throw e;
        }
    }
}


module.exports = MealLib;
