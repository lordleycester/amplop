/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR, isToday, fmtDate, monthLabel, nextMonth, prevMonth } from '../utils/helpers';
import { getGroupColor } from '../utils/sharedUtils';
import { Landmark, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, RefreshCw, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Transaction, Income, Transfer } from '../types';

interface HistoryTabProps {
  onEditTransaction: (tx: Transaction) => void;
  onEditIncome: (inc: Income) => void;
  onEditTransfer: (tf: Transfer) => void;
  onSetToast: (message: string, actionLabel?: string | null, onAction?: (() => void) | null) => void;
  onShowConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  onEditTransaction,
  onEditIncome,
  onEditTransfer,
  onSetToast,
  onShowConfirm
}) => {
  const {
    state,
    filterCatId,
    setFilterCatId,
    viewMonth,
    setViewMonth,
    deleteExpense,
    deleteIncome,
    deleteTransfer
  } = useBudget();

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
    recurring: boolean;
    raw: any;
  }

  const items = useMemo(() => {
    const nextItems: HistoryItem[] = [];
    const recurringOnly = filterCatId === 'recurring';
    const selectedGroupId = filterCatId?.startsWith('group:') ? filterCatId.slice('group:'.length) : null;
    const selectedGroupCategoryIds = selectedGroupId
      ? new Set(state.categories.filter(c => c.groupId === selectedGroupId).map(c => c.id))
      : null;

    // Expenses
    if (filterCatId !== 'income') {
      state.transactions
        .filter(t => {
          if (t.date.substring(0, 7) !== viewMonth) return false;
          if (recurringOnly) return Boolean(t.recurringId);
          if (selectedGroupCategoryIds) return selectedGroupCategoryIds.has(t.catId);
          return !filterCatId || t.catId === filterCatId;
        })
        .forEach(t => {
          const cat = state.categories.find(c => c.id === t.catId);
          const acc = state.accounts.find(a => a.id === t.accountId);
          const color = cat ? getGroupColor(cat.groupId) : '#6b7280';
          nextItems.push({
            id: t.id,
            date: t.date,
            type: 'expense',
            amount: t.amount,
            color,
            label: cat ? cat.name : 'Deleted Expense',
            note: t.note || '',
            subtext: acc ? acc.name : '',
            recurring: Boolean(t.recurringId),
            raw: t
          });
        });
    }

    // Incomes
    if (!filterCatId || filterCatId === 'income' || recurringOnly) {
      state.income
      .filter(i => i.date.substring(0, 7) === viewMonth)
      .filter(i => !recurringOnly || Boolean(i.recurringId))
      .forEach(i => {
        const acc = state.accounts.find(a => a.id === i.accountId);
        nextItems.push({
          id: i.id,
          date: i.date,
          type: 'income',
          amount: i.amount,
          color: '#16a34a', // Emerald Green
          label: 'Income Inflow',
          note: i.note || 'Ready to Assign',
          subtext: acc ? acc.name : '',
          recurring: Boolean(i.recurringId),
          raw: i
        });
      });
    }

    // Transfers
    if (!filterCatId) {
      state.transfers.filter(tf => tf.date.substring(0, 7) === viewMonth).forEach(tf => {
        const fromAcc = state.accounts.find(a => a.id === tf.fromAccountId);
        const toAcc = state.accounts.find(a => a.id === tf.toAccountId);
        nextItems.push({
          id: tf.id,
          date: tf.date,
          type: 'transfer',
          amount: tf.amount,
          color: '#8b5cf6', // Violet
          label: `Transfer Account`,
          note: tf.note || '',
          subtext: `${fromAcc ? fromAcc.name : '?'} → ${toAcc ? toAcc.name : '?'}`,
          recurring: false,
          raw: tf
        });
      });
    }

    return nextItems.sort((a, b) => b.date.localeCompare(a.date));
  }, [filterCatId, state.accounts, state.categories, state.income, state.transactions, state.transfers, viewMonth]);

  const handleEditItem = (item: HistoryItem) => {
    if (item.type === 'expense') onEditTransaction(item.raw as Transaction);
    if (item.type === 'income') onEditIncome(item.raw as Income);
    if (item.type === 'transfer') onEditTransfer(item.raw as Transfer);
  };

  const handleDeleteItem = (item: HistoryItem) => {
    if (item.type === 'expense') {
      onShowConfirm('Delete Transaction?', 'Permanently remove this charge from accounting totals?', () => {
        deleteExpense(item.id);
        onSetToast('Transaction deleted', null, undefined);
      });
      return;
    }

    if (item.type === 'income') {
      onShowConfirm('Delete Income?', 'Permanently remove this income inflow? Ready to Assign balances will decrease.', () => {
        deleteIncome(item.id);
        onSetToast('Income transaction deleted', null, undefined);
      });
      return;
    }

    onShowConfirm('Delete Transfer?', 'Erase this account transfer? Starting account balances will adjust back instantly.', () => {
      deleteTransfer(item.id);
      onSetToast('Account transfer deleted', null, undefined);
    });
  };

  const sortedGroups = useMemo(
    () => [...state.groups].sort((a, b) => a.sort - b.sort),
    [state.groups]
  );

  const activeCategory = useMemo(
    () => state.categories.find(c => c.id === filterCatId),
    [filterCatId, state.categories]
  );
  const activeGroupId = filterCatId?.startsWith('group:')
    ? filterCatId.slice('group:'.length)
    : activeCategory?.groupId ?? null;
  const activeGroup = useMemo(
    () => state.groups.find(g => g.id === activeGroupId),
    [activeGroupId, state.groups]
  );
  const activeGroupCategories = useMemo(
    () => activeGroupId
      ? state.categories.filter(c => c.groupId === activeGroupId).sort((a, b) => a.sort - b.sort)
      : [],
    [activeGroupId, state.categories]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50" id="tx-history-tab">
      {/* Horizontal Filter Bar */}
      <div className="bg-white border-b border-gray-150 shrink-0 select-none" id="tx-filter-area">
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100" id="tx-month-filter-bar">
          <button
            onClick={() => setViewMonth(prevMonth(viewMonth))}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 border-b-2 border-b-gray-300 text-gray-600 hover:bg-gray-50 active:translate-y-[1px] active:border-b rounded"
            aria-label="Previous month"
            id="tx-month-prev"
          >
            <ChevronLeft size={16} />
          </button>

          <label className="relative min-w-0 flex-1 max-w-[220px]" id="tx-month-picker-label">
            <div className="h-8 px-3 flex items-center justify-center gap-2 bg-slate-50 border border-gray-200 border-b-2 border-b-gray-300 rounded text-xs font-bold text-gray-800">
              <CalendarDays size={14} className="text-gray-500" />
              <span className="truncate">{monthLabel(viewMonth)}</span>
            </div>
            <input
              type="month"
              value={viewMonth}
              onChange={(e) => setViewMonth(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Filter history by month"
              id="tx-month-picker"
            />
          </label>

          <button
            onClick={() => setViewMonth(nextMonth(viewMonth))}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 border-b-2 border-b-gray-300 text-gray-600 hover:bg-gray-50 active:translate-y-[1px] active:border-b rounded"
            aria-label="Next month"
            id="tx-month-next"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none" id="tx-filter-bar">
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

          <button
            onClick={() => setFilterCatId('recurring')}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap flex items-center gap-1.5 ${filterCatId === 'recurring' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
            id="tx-filter-recurring"
          >
            <RefreshCw size={12} />
            Recurring
          </button>

          {sortedGroups.map(group => {
            const groupFilterId = `group:${group.id}`;
            const color = getGroupColor(group.id);
            const isSelected = filterCatId === groupFilterId || activeCategory?.groupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setFilterCatId(groupFilterId)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap flex items-center gap-1.5 ${isSelected ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                id={`tx-filter-group-${group.id}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : color }} />
                {group.name}
              </button>
            );
          })}
        </div>

        {activeGroup && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 scrollbar-none" id="tx-category-filter-bar">
            <button
              onClick={() => setFilterCatId(`group:${activeGroup.id}`)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap ${filterCatId === `group:${activeGroup.id}` ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
              id={`tx-filter-group-all-${activeGroup.id}`}
            >
              All {activeGroup.name}
            </button>

            {activeGroupCategories.map(c => {
              const color = getGroupColor(c.groupId);
              const isSelected = filterCatId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilterCatId(c.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap flex items-center gap-1.5 ${isSelected ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                  id={`tx-filter-cat-${c.id}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : color }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-150/40" id="tx-feed">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2" id="tx-empty-state">
            <Landmark size={24} className="text-gray-300" />
            <span>No transactions found for {activeCategory ? `"${activeCategory.name}"` : activeGroup ? `"${activeGroup.name}"` : filterCatId === 'income' ? '"Income"' : filterCatId === 'recurring' ? '"Recurring"' : 'this view'} in {monthLabel(viewMonth)}.</span>
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
                    className="flex items-center justify-between gap-4 py-3 px-4 bg-white select-none transition"
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
                        {item.recurring && (
                          <div className="inline-flex items-center gap-1 mt-1 border border-gray-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500" id={`tx-row-recurring-${item.id}`}>
                            <RefreshCw size={9} />
                            Recurring
                          </div>
                        )}
                        {displaySub && (
                          <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5" id={`tx-row-sub-${item.id}`}>
                            {displaySub}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Styled price column */}
                    <div className="flex-shrink-0 flex items-center justify-end gap-2" id={`tx-row-actions-wrap-${item.id}`}>
                      <div className="text-right font-mono" id={`tx-row-price-${item.id}`}>
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

                      <div className="flex items-center gap-1" id={`tx-row-actions-${item.id}`}>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditItem(item);
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 border-b-2 border-b-gray-300 text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 active:translate-y-[1px] active:border-b rounded"
                          aria-label={`Edit ${item.label}`}
                          title="Edit"
                          id={`tx-row-edit-${item.id}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteItem(item);
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-red-100 border-b-2 border-b-red-200 text-red-500 hover:bg-red-50 active:translate-y-[1px] active:border-b rounded"
                          aria-label={`Delete ${item.label}`}
                          title="Delete"
                          id={`tx-row-delete-${item.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
