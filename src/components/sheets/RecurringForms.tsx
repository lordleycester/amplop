/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import type { Recurring } from '../../types';
import type {
  AmountFormState,
  BasicFormState,
  DateFormState,
  NoteFormState,
  RecurringFormState,
  SecondSelectFormState,
  SelectFormState,
  SheetCallbacks
} from './SheetFormProps';

interface RecurringFormProps
  extends BasicFormState,
    AmountFormState,
    SelectFormState,
    SecondSelectFormState,
    DateFormState,
    NoteFormState,
    RecurringFormState,
    SheetCallbacks {
  recurring?: Recurring;
}

const RecurringFields: React.FC<RecurringFormProps & { mode: 'add' | 'edit' }> = ({
  mode,
  formName,
  setFormName,
  formAmountStr,
  setFormAmountStr,
  formSelectedId,
  setFormSelectedId,
  formSelectedId2,
  setFormSelectedId2,
  formDate,
  setFormDate,
  formRecurringType,
  setFormRecurringType,
  formDayOfMonth,
  setFormDayOfMonth
}) => {
  const { state } = useBudget();
  const isAdd = mode === 'add';

  return (
    <>
      {isAdd && (
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormRecurringType('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${formRecurringType === 'expense' ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              Expense Outflow
            </button>
            <button
              onClick={() => setFormRecurringType('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${formRecurringType === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              Income Inflow
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Name</label>
        <input
          type="text"
          autoFocus={isAdd}
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder={isAdd ? 'e.g. Netflix subscription, Monthly rent' : undefined}
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
          id={isAdd ? 'rec-name' : undefined}
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount (Rp)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formAmountStr}
          onChange={(e) => setFormAmountStr(e.target.value)}
          placeholder={isAdd ? '0' : undefined}
          className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
          id={isAdd ? 'rec-amt' : undefined}
        />
        {isAdd && (
          <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="rec-amt-pv">
            {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3" id={isAdd ? 'rec-selections' : undefined}>
        {formRecurringType === 'expense' && (
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category</label>
            <select
              value={formSelectedId}
              onChange={(e) => setFormSelectedId(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
              id={isAdd ? 'rec-cat' : undefined}
            >
              <option value="">Select Category</option>
              {state.groups.map(g => (
                <optgroup key={g.id} label={g.name}>
                  {state.categories.filter(c => c.groupId === g.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Source</label>
          <select
            value={formSelectedId2}
            onChange={(e) => setFormSelectedId2(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
            id={isAdd ? 'rec-acc' : undefined}
          >
            <option value="">Select Account</option>
            {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3" id={isAdd ? 'rec-days-dates' : 'edit-rec-numeric'}>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">{isAdd ? 'Day of Month (1-28)' : 'Day of Month'}</label>
          <input
            type="text"
            inputMode="numeric"
            value={formDayOfMonth}
            onChange={(e) => setFormDayOfMonth(e.target.value)}
            placeholder={isAdd ? '1' : undefined}
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono outline-none focus:border-emerald-600 transition"
            id={isAdd ? 'rec-day' : undefined}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Start Date</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
            id={isAdd ? 'rec-start' : undefined}
          />
        </div>
      </div>
    </>
  );
};

export const AddRecurringForm: React.FC<RecurringFormProps> = (props) => {
  const { addRecurring } = useBudget();

  return (
    <div className="space-y-4" id="form-add-recurring">
      <RecurringFields {...props} mode="add" />
      <button
        onClick={() => {
          const recValue = parseAmount(props.formAmountStr);
          const payDay = Math.min(28, Math.max(1, parseInt(props.formDayOfMonth) || 1));

          if (!props.formName.trim() || !recValue) return;

          addRecurring(
            props.formName.trim(),
            recValue,
            props.formRecurringType,
            props.formRecurringType === 'income' ? null : props.formSelectedId || null,
            props.formSelectedId2 || null,
            payDay,
            props.formDate,
            null
          );
          props.closeSheet();
          props.showToast(`Recurring schedule "${props.formName}" created!`, null, undefined);
        }}
        disabled={!props.formName.trim() || !parseAmount(props.formAmountStr)}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition font-sans"
        id="rec-submit-btn"
      >
        Save Recurring Schedule
      </button>
    </div>
  );
};

export const EditRecurringForm: React.FC<RecurringFormProps> = (props) => {
  const { editRecurring } = useBudget();

  return (
    <div className="space-y-4" id="form-edit-recurring">
      <RecurringFields {...props} mode="edit" />
      <button
        onClick={() => {
          if (!props.recurring || !props.formName.trim()) return;
          const recValue = parseAmount(props.formAmountStr);
          const dayNum = Math.min(28, Math.max(1, parseInt(props.formDayOfMonth) || 1));

          editRecurring(
            props.recurring.id,
            props.formName.trim(),
            recValue,
            props.formRecurringType,
            props.formRecurringType === 'income' ? null : props.formSelectedId || null,
            props.formSelectedId2 || null,
            dayNum,
            props.formDate,
            null
          );
          props.closeSheet();
          props.showToast('Recurring schedule details updated', null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
      >
        Simpan
      </button>
    </div>
  );
};
