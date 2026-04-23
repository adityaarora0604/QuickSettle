export enum SplitType {
  EQUAL = 'EQUAL',
  EXACT = 'EXACT',
  PERCENTAGE = 'PERCENTAGE',
  SHARES = 'SHARES'
}

export interface Member {
  id: string;
  name: string;
}

export interface SplitDetail {
  memberId: string;
  value: number; // Amount, percentage, or shares depending on SplitType
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // Member ID
  splitType: SplitType;
  splitDetails: SplitDetail[];
  date: number;
}

export interface Transaction {
  from: string; // Member ID
  to: string; // Member ID
  amount: number;
}

export interface Balance {
  memberId: string;
  amount: number;
}
