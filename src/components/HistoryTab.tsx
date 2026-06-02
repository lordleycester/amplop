/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, isToday, fmtDate } from '../utils/helpers';
import { getGroupColor } from '../utils/sharedUtils';
import { Landmark, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';
import { Transaction, Income, Transfer } from '../types';

interface HistoryTabProps {
  onTransactionClick: (tx: Transaction) => void;
  onIncomeClick: (inc: Income) => void;
  onTransferClick: (tf: Transfer) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  onTransactionClick,
  onIncomeClick,
  onTransferClick
}) => {
  const { state, filterCatId, setFilterCatId } = useBudget();

  // Compile history items from all sources
  interface HistoryItem {
    id: string;
    date: string;
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    color: string;
    label: string;
    note: string;
    subtext: string;
    raw: any;
  }

  const items: HistoryItem[] = [];

  // Expenses
  if (filterCatId !== 'income') {
    state.transactions
      .filter(t => !filterCatId || t.catId === filterCatId)
      .forEach(t => {
        const cat = state.categories.find(c => c.id === t.catId);
        const acc = state.accounts.find(a => a.id === t.accountId);
        const color = cat ? getGroupColor(cat.groupId) : '#6b7280';
        items.push({
          id: t.id,
          date: t.date,
          type: 'expense',
          amount: t.amount,
          color,
          label: cat ? cat.name : 'Deleted Expense',
          note: t.note || '',
          subtext: acc ? acc.name : '',
          raw: t
        });
      });
  }

  // Incomes
  if (!filterCatId || filterCatId === 'income') {
    state.income.forEach(i => {
      const acc = state.accounts.find(a => a.id === i.accountId);
      items.push({
        id: i.id,
        date: i.date,
        type: 'income',
        amount: i.amount,
        color: '#16a34a', // Emerald Green
        label: 'Income Inflow',
        note: i.note || 'Ready to Assign',
        subtext: acc ? acc.name : '',
        raw: i
      });
    });
  }

  // Transfers
  if (!filterCatId) {
    state.transfers.forEach(tf => {
      const fromAcc = state.accounts.find(a => a.id === tf.fromAccountId);
      const toAcc   = state.accounts.find(a => a.id === tf.toAccountId);
      items.push({
        id: tf.id,
        date: tf.date,
        type: 'transfer',
        amount: tf.amount,
        color: '#8b5cf6', // Violet
        label: `Transfer Account`,
        note: tf.note || '',
        subtext: `${fromAcc ? fromAcc.name : '?'} → ${toAcc ? toAcc.name : '?'}`,
        raw: tf
      });
    });
  }

  // Sort by date descending
  items.sort((a, b) => b.date.localeCompare(a.date));

  // Handle cell click
  const handleItemClick = (item: HistoryItem) => {
    if (item.type === 'expense') onTransactionClick(item.raw as Transaction);
    if (item.type === 'income') onIncomeClick(item.raw as Income);
    if (item.type === 'transfer') onTransferClick(item.raw as Transfer);
  };

  const activeCategory = state.categories.find(c => c.id === filterCatId);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50" id="tx-history-tab">
      {/* Horizontal Filter Bar */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 bg-white border-b border-gray-150 shrink-0 select-none scrollbar-none" id="tx-filter-bar">
        <button
          onClick={() => setFilterCatId(null)}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap ${filterCatId === null ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
          id="tx-filter-all"
        >
          All
        </button>

        <button
          onClick={() => setFilterCatId('income')}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap ${filterCatId === 'income' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
          id="tx-filter-income"
        >
          Income
        </button>

        {state.categories.map(c => {
          const color = getGroupColor(c.groupId);
          const isSelected = filterCatId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilterCatId(c.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap flex items-center gap-1.5 ${isSelected ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              id={`tx-filter-cat-${c.id}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : color }} />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Transaction List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-150/40" id="tx-feed">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2" id="tx-empty-state">
            <Landmark size={24} className="text-gray-300" />
            <span>No transactions found for {activeCategory ? `"${activeCategory.name}"` : filterCatId === 'income' ? '"Income"' : 'this view'}.</span>
          </div>
        ) : (
          (() => {
            let lastHeaderDate = '';
            return items.map(item => {
              const showHeader = item.date !== lastHeaderDate;
              if (showHeader) {
                lastHeaderDate = item.date;
              }

              const displaySub = [item.subtext, item.note].filter(Boolean).join(' · ');

              return (
                <div key={item.id} className="flex flex-col" id={`tx-item-box-${item.id}`}>
                  {/* Floating Date Category Header */}
                  {showHeader && (
                    <div className="bg-gray-100/50 px-4 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-150/20 select-none shrink-0" id={`tx-header-${item.date}`}>
                      {isToday(item.date) ? 'Today' : fmtDate(item.date)}
                    </div>
                  )}

                  {/* List Item Row */}
                  <div
                    onClick={() => handleItemClick(item)}
                    className="flex items-center justify-between gap-4 py-3 px-4 bg-white hover:bg-gray-50/70 select-none cursor-pointer transition"
                    id={`tx-row-${item.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0" id={`tx-row-left-${item.id}`}>
                      {/* Round Dot Wrapping Icon */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        id={`tx-icon-${item.id}`}
                      >
                        {item.type === 'expense' && <ArrowDownCircle size={15} />}
                        {item.type === 'income' && <ArrowUpCircle size={15} />}
                        {item.type === 'transfer' && <ArrowRightLeft size={14} />}
                      </div>

                      <div className="min-w-0" id={`tx-row-middle-${item.id}`}>
                        <div className="text-xs font-semibold text-gray-800 truncate" id={`tx-row-label-${item.id}`}>
                          {item.label}
                        </div>
                        {displaySub && (
                          <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5" id={`tx-row-sub-${item.id}`}>
                            {displaySub}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Styled price column */}
                    <div className="flex-shrink-0 text-right font-mono" id={`tx-row-price-${item.id}`}>
                      {item.type === 'transfer' ? (
                        <div className="text-xs font-bold text-gray-400 flex items-center justify-end gap-1 select-none">
                          ↔ {fmtIDR(item.amount)}
                        </div>
                      ) : (
                        <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${item.type === 'income' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {item.type === 'income' ? '+' : '−'} {fmtIDR(item.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
};
