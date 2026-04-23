import { Balance, Transaction, SplitType, Expense } from './types';

/**
 * Optimizes transactions to settle debts within a group.
 * Uses a greedy approach to minimize the number of transfers.
 */
export function calculateSettlements(balances: Balance[]): Transaction[] {
  // Filter out zero balances and separate into creditors and debtors
  const creditors = balances
    .filter((b) => b.amount > 0.01)
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.amount < -0.01)
    .map((b) => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    if (settlementAmount > 0.01) {
      transactions.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: Number(settlementAmount.toFixed(2)),
      });
    }

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

export function getBalances(members: string[], expenses: Expense[]): Balance[] {
  const balanceMap: Record<string, number> = {};
  members.forEach((id) => (balanceMap[id] = 0));

  expenses.forEach((expense) => {
    const amount = expense.amount;
    
    // The person who paid gets a credit
    balanceMap[expense.paidBy] += amount;

    // Calculate shares based on split type
    if (expense.splitType === SplitType.EQUAL) {
      const share = amount / expense.splitDetails.length;
      expense.splitDetails.forEach((detail) => {
        balanceMap[detail.memberId] -= share;
      });
    } else if (expense.splitType === SplitType.EXACT) {
      expense.splitDetails.forEach((detail) => {
        balanceMap[detail.memberId] -= detail.value;
      });
    } else if (expense.splitType === SplitType.PERCENTAGE) {
      expense.splitDetails.forEach((detail) => {
        balanceMap[detail.memberId] -= (amount * detail.value) / 100;
      });
    } else if (expense.splitType === SplitType.SHARES) {
      const totalShares = expense.splitDetails.reduce((sum, d) => sum + d.value, 0);
      if (totalShares > 0) {
        expense.splitDetails.forEach((detail) => {
          balanceMap[detail.memberId] -= (amount * detail.value) / totalShares;
        });
      }
    }
  });

  return Object.entries(balanceMap).map(([memberId, amount]) => ({
    memberId,
    amount,
  }));
}
