/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { fmtDateShort, fmtIDR, monthLabelShort, parseAmount } from '../../utils/helpers';
import { getGroupColor } from '../../utils/sharedUtils';
import type { Category } from '../../types';
import type { AmountFormState, SelectFormState, SheetCallbacks, TargetFormState } from './SheetFormProps';

interface CategoryDetailSheetProps {
  category: Category;
  onSetTarget: (category: Category) => void;
  onMoveMoney: (category: Category) => void;
}

export const CategoryDetailSheet: React.FC<CategoryDetailSheetProps> = ({
  category,
  onSetTarget,
  onMoveMoney
}) => {
  const { state, viewMonth, getAssigned, getSpent, getAvailable } = useBudget();
  const assigned = getAssigned(category.id, viewMonth);
  const spent = getSpent(category.id, viewMonth);
  const available = getAvailable(category.id, viewMonth);
  const targetInfo = category.target;

  const thisMonthsTxs = state.transactions
    .filter(t => t.catId === category.id && t.date.substring(0, 7) === viewMonth)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-4" id="cat-details-sheet">
      <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/50 space-y-2 select-none" id="cat-details-stats">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-medium">Assigned {monthLabelShort(viewMonth)}</span>
          <span className="font-semibold text-gray-800 font-mono">{fmtIDR(assigned)}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
          <span className="text-gray-400 font-medium">Spent this month</span>
          <span className="font-semibold text-red-650 font-mono">{spent > 0 ? `-${fmtIDR(spent)}` : 'Rp0'}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
          <span className="text-gray-400 font-medium">Carryover Available</span>
          <span className={`font-bold font-mono ${available >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmtIDR(available)}</span>
        </div>

        {targetInfo && (
          <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-2 select-none" id="cat-details-target">
            <span className="text-emerald-800 font-semibold">{targetInfo.type === 'monthly' ? 'Monthly Target' : targetInfo.type === 'by_date' ? 'By Date Target' : 'Monthly Builder'}</span>
            <span className="text-emerald-800 font-bold font-mono">
              {targetInfo.type === 'by_date' && targetInfo.dueDate
                ? `${fmtIDR(targetInfo.amount)} by ${targetInfo.dueDate}`
                : `${fmtIDR(targetInfo.amount)} / month`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3" id="cat-sheet-actions">
        <button
          onClick={() => onSetTarget(category)}
          className="py-2 px-3 border border-emerald-800/20 text-emerald-800 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          id="cat-action-target"
        >
          Set Target
        </button>
        <button
          onClick={() => onMoveMoney(category)}
          className="py-2 px-3 border border-emerald-800/20 text-emerald-800 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          id="cat-action-move"
        >
          Move Money
        </button>
      </div>

      <div className="space-y-2 select-none pt-2" id="cat-sheet-txs">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Category Activity (This Month)</h4>
        <div className="border border-gray-150 rounded-lg overflow-hidden divide-y divide-gray-100 bg-white" id="cat-sheet-tx-list">
          {thisMonthsTxs.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 italic">No category transactions this month</div>
          ) : (
            thisMonthsTxs.map(t => (
              <div key={t.id} className="flex justify-between items-center p-2.5 text-xs">
                <span className="text-gray-500 font-medium truncate max-w-[200px]" id={`cat-tx-note-${t.id}`}>{t.note || 'Expense'}</span>
                <span className="font-bold text-red-750 shrink-0 font-mono" id={`cat-tx-val-${t.id}`}>-{fmtIDR(t.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface CategoryActivitySheetProps {
  category: Category;
}

export const CategoryActivitySheet: React.FC<CategoryActivitySheetProps> = ({ category }) => {
  const { state, viewMonth, getSpent } = useBudget();
  const spent = getSpent(category.id, viewMonth);

  const thisMonthsTxs = state.transactions
    .filter(t => t.catId === category.id && t.date.substring(0, 7) === viewMonth)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4" id="cat-activity-sheet">
      <div className="flex items-center justify-between border border-gray-150 bg-gray-50 rounded p-3 select-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Spent {monthLabelShort(viewMonth)}
        </span>
        <span className="font-mono text-sm font-bold text-red-650">
          {spent > 0 ? `-${fmtIDR(spent)}` : 'Rp0'}
        </span>
      </div>

      <div className="border border-gray-150 rounded-md overflow-hidden divide-y divide-gray-100 bg-white" id="cat-activity-list">
        {thisMonthsTxs.length === 0 ? (
          <div className="p-5 text-center text-xs text-gray-400 italic">
            No activity for this category this month.
          </div>
        ) : (
          thisMonthsTxs.map(tx => {
            const account = state.accounts.find(a => a.id === tx.accountId);

            return (
              <div key={tx.id} className="flex items-center justify-between gap-3 p-3 text-xs" id={`cat-activity-row-${tx.id}`}>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-700 truncate">{tx.note || 'Expense'}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                    {fmtDateShort(tx.date)}{account ? ` · ${account.name}` : ''}
                  </div>
                </div>
                <span className="font-mono font-bold text-red-650 shrink-0">-{fmtIDR(tx.amount)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface SetTargetFormProps extends AmountFormState, TargetFormState, SheetCallbacks {
  category: Category;
}

export const SetTargetForm: React.FC<SetTargetFormProps> = ({
  category,
  formTargetType,
  setFormTargetType,
  formAmountStr,
  setFormAmountStr,
  formTargetMonth,
  setFormTargetMonth,
  closeSheet,
  showToast
}) => {
  const { setCategoryTarget } = useBudget();

  return (
    <div className="space-y-4" id="form-set-target">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Target Type</label>
        <div className="flex gap-2">
          {(['none', 'monthly', 'monthly_builder', 'by_date'] as const).map(typeKey => (
            <button
              key={typeKey}
              onClick={() => {
                setFormTargetType(typeKey);
                if (typeKey === 'none') {
                  setFormAmountStr('');
                }
              }}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded border transition capitalize ${formTargetType === typeKey ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white text-gray-450 border-gray-200 hover:bg-gray-100'}`}
            >
              {typeKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {formTargetType !== 'none' && (
        <>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Goal Amount (Rp)</label>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={formAmountStr}
              onChange={(e) => setFormAmountStr(e.target.value)}
              placeholder="e.g. 500k"
              className="w-full text-center px-4 py-3 bg-gray-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
            />
            <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5">
              {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
            </div>
          </div>

          {formTargetType === 'by_date' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Target Date (Due Month)</label>
              <input
                type="month"
                value={formTargetMonth}
                onChange={(e) => setFormTargetMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs font-mono outline-none"
              />
            </div>
          )}
        </>
      )}

      <button
        onClick={() => {
          if (formTargetType === 'none') {
            setCategoryTarget(category.id, null);
          } else {
            const goalAmount = parseAmount(formAmountStr);
            setCategoryTarget(category.id, {
              type: formTargetType,
              amount: goalAmount,
              dueDate: formTargetType === 'by_date' ? formTargetMonth : undefined
            });
          }
          closeSheet();
          showToast('Category targets updated', null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
        id="form-target-submit"
      >
        Save Target Goal
      </button>
    </div>
  );
};

interface MoveMoneyFormProps extends AmountFormState, SelectFormState, SheetCallbacks {
  sourceCategory: Category;
}

export const MoveMoneyForm: React.FC<MoveMoneyFormProps> = ({
  sourceCategory,
  formSelectedId,
  setFormSelectedId,
  formAmountStr,
  setFormAmountStr,
  closeSheet,
  showToast
}) => {
  const { state, viewMonth, getAvailable, getAssigned, setAssigned } = useBudget();
  const srcAvail = getAvailable(sourceCategory.id, viewMonth);
  const others = state.categories.filter(c => c.id !== sourceCategory.id);
  const cleanAmount = parseAmount(formAmountStr);

  return (
    <div className="space-y-4 font-sans" id="form-move-money">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount To Move</label>
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={formAmountStr}
          onChange={(e) => setFormAmountStr(e.target.value)}
          placeholder="e.g. 100k"
          className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
          id="move-amt-input"
        />
        {srcAvail > 0 && (
          <button
            onClick={() => setFormAmountStr(String(srcAvail))}
            className="w-full py-2 px-3 border border-emerald-800/20 text-emerald-800 bg-white hover:bg-emerald-50 rounded-md text-xs font-semibold transition"
            id="move-all-available-btn"
          >
            Use all available ({fmtIDR(srcAvail)})
          </button>
        )}
      </div>

      <div className="space-y-1.5" id="move-dest-list">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Move To</label>
        <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-100 rounded-md border border-gray-150 shadow-sm bg-white" id="move-dest-elements">
          {others.map(c => {
            const av = getAvailable(c.id, viewMonth);
            const isSelected = formSelectedId === c.id;
            const dotColor = getGroupColor(c.groupId);

            return (
              <button
                key={c.id}
                onClick={() => setFormSelectedId(c.id)}
                className={`w-full flex justify-between items-center p-3 select-none text-left transition ${isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50/50'}`}
                id={`move-row-${c.id}`}
              >
                <div className="flex items-center gap-2 min-w-0" id={`move-row-left-${c.id}`}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                  <span className="text-xs font-semibold text-gray-700 truncate">{c.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold font-mono shrink-0">{fmtIDR(av)} av</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          if (!cleanAmount || !formSelectedId) return;

          const srcAssigned = getAssigned(sourceCategory.id, viewMonth);
          const destAssigned = getAssigned(formSelectedId, viewMonth);

          setAssigned(sourceCategory.id, viewMonth, srcAssigned - cleanAmount);
          setAssigned(formSelectedId, viewMonth, destAssigned + cleanAmount);
          closeSheet();
          showToast(`Moved ${fmtIDR(cleanAmount)} from ${sourceCategory.name}`, null, undefined);
        }}
        disabled={!formSelectedId || !cleanAmount}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1"
        id="move-submit-btn"
      >
        <ArrowLeftRight size={13} />
        Move {cleanAmount ? fmtIDR(cleanAmount) : ''}
      </button>
    </div>
  );
};
