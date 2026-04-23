import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Receipt, 
  ArrowRightLeft, 
  ChevronRight, 
  Wallet,
  Info,
  CheckCircle2,
  X,
  PieChart,
  Hash,
  Percent,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, Expense, Transaction, Balance, SplitType, SplitDetail } from './types';
import { calculateSettlements, getBalances } from './settle';

export default function App() {
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Aditya' },
    { id: '2', name: 'Rahul' },
    { id: '3', name: 'Sneha' }
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // New Expense Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const balances = useMemo(() => 
    getBalances(members.map(m => m.id), expenses), 
    [members, expenses]
  );

  const settlements = useMemo(() => 
    calculateSettlements(balances), 
    [balances]
  );

  const currencySymbol = '₹';

  // Initialize split details when members or split type changes
  useEffect(() => {
    if (isAddingExpense) {
      setSplitDetails(members.map(m => ({
        memberId: m.id,
        value: splitType === SplitType.EQUAL ? 1 : 0
      })));
    }
  }, [isAddingExpense, members, splitType]);

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName.trim()
    };
    setMembers([...members, newMember]);
    setNewMemberName('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    setExpenses(expenses.filter(e => e.paidBy !== id && !e.splitDetails.some(d => d.memberId === id)));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description || isNaN(numAmount) || !paidBy) return;

    // Validation based on split type
    if (splitType === SplitType.EQUAL && splitDetails.filter(d => d.value > 0).length === 0) return;
    if (splitType === SplitType.EXACT) {
      const total = splitDetails.reduce((sum, d) => sum + d.value, 0);
      if (Math.abs(total - numAmount) > 0.01) {
        alert(`Total split amount (${total}) must equal expense amount (${numAmount})`);
        return;
      }
    }
    if (splitType === SplitType.PERCENTAGE) {
      const total = splitDetails.reduce((sum, d) => sum + d.value, 0);
      if (Math.abs(total - 100) > 0.01) {
        alert(`Total percentage must equal 100% (currently ${total}%)`);
        return;
      }
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description,
      amount: numAmount,
      paidBy,
      splitType,
      splitDetails: splitDetails.filter(d => d.value > 0 || splitType !== SplitType.EQUAL),
      date: Date.now()
    };

    setExpenses([newExpense, ...expenses]);
    setIsAddingExpense(false);
    resetExpenseForm();
  };

  const resetExpenseForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy('');
    setSplitType(SplitType.EQUAL);
  };

  const updateSplitDetail = (memberId: string, value: number) => {
    setSplitDetails(prev => prev.map(d => d.memberId === memberId ? { ...d, value } : d));
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F1115] text-[#1A1A1A] dark:text-white font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-[#1A1D23] border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <ArrowRightLeft size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">QuickSettle</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsAddingExpense(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Members & Balances */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white dark:bg-[#1A1D23] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Users size={16} />
                Group Members
              </h2>
              <span className="text-xs font-medium bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                {members.length}
              </span>
            </div>
            
            <form onSubmit={addMember} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Add name..."
                className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white dark:placeholder:text-gray-500"
              />
              <button type="submit" className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                <Plus size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </form>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {members.map((member) => {
                  const balance = balances.find(b => b.memberId === member.id)?.amount || 0;
                  return (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {member.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {balance === 0 ? (
                              <span>Settled</span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span>{balance > 0 ? 'Gets' : 'Owes'} {currencySymbol}{Math.abs(balance).toFixed(2)}</span>
                                <div className="normal-case font-normal text-gray-400 dark:text-gray-500 lowercase">
                                  {settlements
                                    .filter(s => s.from === member.id)
                                    .map((s, i) => (
                                      <div key={i}>pay {getMemberName(s.to)} {currencySymbol}{s.amount}</div>
                                    ))
                                  }
                                  {settlements
                                    .filter(s => s.to === member.id)
                                    .map((s, i) => (
                                      <div key={i}>from {getMemberName(s.from)} {currencySymbol}{s.amount}</div>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeMember(member.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>

          <section className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-4 flex items-center gap-2">
              <Wallet size={16} />
              Settlement Plan
            </h2>
            {settlements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 opacity-70">
                <CheckCircle2 size={32} className="mb-2" />
                <p className="text-sm">All settled up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-3 flex items-center justify-between text-sm backdrop-blur-sm border border-white/10">
                    <div className="flex flex-col">
                      <span className="font-bold">{getMemberName(s.from)}</span>
                      <span className="text-[10px] opacity-70 uppercase">Pays</span>
                    </div>
                    <div className="flex flex-col items-center px-2">
                      <ChevronRight size={16} className="opacity-50" />
                      <span className="font-mono font-bold">{currencySymbol}{s.amount}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold">{getMemberName(s.to)}</span>
                      <span className="text-[10px] opacity-70 uppercase">To</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Expenses History */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white dark:bg-[#1A1D23] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Receipt size={16} />
                Expense History
              </h2>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Total: {currencySymbol}{expenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
              </div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {expenses.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info size={24} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses yet. Add one to get started!</p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold dark:text-white">{expense.description}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Paid by <span className="font-medium text-gray-700 dark:text-gray-300">{getMemberName(expense.paidBy)}</span> • 
                          Split: <span className="font-medium text-gray-700 dark:text-gray-300 uppercase">{expense.splitType}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold dark:text-white">{currencySymbol}{expense.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingExpense(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#1A1D23] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8 border dark:border-white/10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold dark:text-white">Add New Expense</h2>
                <button 
                  onClick={() => setIsAddingExpense(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Description</label>
                    <input
                      required
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Dinner"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white dark:placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Amount</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Paid By</label>
                  <select
                    required
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none dark:text-white"
                  >
                    <option value="" className="dark:bg-[#1A1D23]">Select member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="dark:bg-[#1A1D23]">{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Split Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: SplitType.EQUAL, icon: PieChart, label: 'Equal' },
                      { type: SplitType.EXACT, icon: Hash, label: 'Exact' },
                      { type: SplitType.PERCENTAGE, icon: Percent, label: 'Percent' },
                      { type: SplitType.SHARES, icon: Users, label: 'Shares' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSplitType(item.type)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                          splitType === item.type 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="text-[10px] font-bold uppercase">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Split Details</label>
                  <div className="space-y-2">
                    {members.map(member => {
                      const detail = splitDetails.find(d => d.memberId === member.id);
                      const value = detail?.value || 0;
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs border border-gray-100 dark:border-white/10">
                              {member.name[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium dark:text-white">{member.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {splitType === SplitType.EQUAL ? (
                              <button
                                type="button"
                                onClick={() => updateSplitDetail(member.id, value === 1 ? 0 : 1)}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                                  value === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10'
                                }`}
                              >
                                {value === 1 && <CheckCircle2 size={14} />}
                              </button>
                            ) : (
                              <div className="relative">
                                <input
                                  type="number"
                                  value={value || ''}
                                  onChange={(e) => updateSplitDetail(member.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                                  placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-gray-500 pointer-events-none">
                                  {splitType === SplitType.PERCENTAGE ? '%' : splitType === SplitType.SHARES ? 'sh' : currencySymbol}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {splitType === SplitType.EXACT && (
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-400 dark:text-gray-500">Total Split:</span>
                      <span className={Math.abs(splitDetails.reduce((sum, d) => sum + d.value, 0) - parseFloat(amount)) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                        {currencySymbol}{splitDetails.reduce((sum, d) => sum + d.value, 0).toFixed(2)} / {currencySymbol}{parseFloat(amount || '0').toFixed(2)}
                      </span>
                    </div>
                  )}
                  {splitType === SplitType.PERCENTAGE && (
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-400 dark:text-gray-500">Total Percentage:</span>
                      <span className={Math.abs(splitDetails.reduce((sum, d) => sum + d.value, 0) - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                        {splitDetails.reduce((sum, d) => sum + d.value, 0).toFixed(1)}% / 100%
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] mt-4"
                >
                  Add Expense
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
