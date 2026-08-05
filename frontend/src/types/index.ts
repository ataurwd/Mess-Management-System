export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  messId: string;
}

export interface MessSummary {
  messTotalBalance?: number;
  messTotalExpense?: number;
  totalMeal?: number;
  mealRate?: number;
}

export interface Category {
  _id: string;
  name: string;
  categoryType?: string;
}

export interface Balance {
  _id: string;
  userId: string | User;
  amount: number;
  date: string;
  categoryId?: string | Category;
  messId: string;
}

export interface Expense {
  _id: string;
  userId: string | User;
  amount: number;
  date: string;
  categoryId?: string | Category;
  itemDetails?: string;
}

export interface Meal {
  _id: string;
  userId: string | User;
  numberOfMeal: number;
  date: string;
}
