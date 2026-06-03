/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import type {
  AmountFormState,
  DateFormState,
  NoteFormState,
  SecondSelectFormState,
  SelectFormState,
  SheetCallbacks
} from './SheetFormProps';
import type { Transfer } from '../../types';

interface TransferFormProps
  extends AmountFormState,
    SelectFormState,
    SecondSelectFormState,
    DateFormState,
    NoteFormState,
    SheetCallbacks {
  transfer?: Transfer;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  transfer,
  formAmountStr,
  setFormAmountStr,
  formSelectedId,
  setFormSelectedId,
  formSelectedId2,
  setFormSelectedId2,
  formDate,
  setFormDate,
  formNote,
  setFormNote,
  closeSheet,
  showToast
}) => {
  const { state, getAccountBalance, addTransfer, editTransfer } = useBudget();
  const isEdit = Boolean(transfer);

  return (
    <div className="space-y-4" id="form-transfer">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-sans">From Account</label>
        <select
          value={formSelectedId}
          onChange={(e) => setFormSelectedId(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
          id="tf-from"
        >
          <option value="">Select Account</option>
          {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtIDR(getAccountBalance(a.id))})</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-sans">To Account</label>
        <select
          value={formSelectedId2}
          onChange={(e) => setFormSelectedId2(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
          id="tf-to"
        >
          <option value="">Select Destination</option>
          {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtIDR(getAccountBalance(a.id))})</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount (Rp)</label>
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={formAmountStr}
          onChange={(e) => setFormAmountStr(e.target.value)}
          placeholder="0"
          className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
          id="tf-amt"
        />
        <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="tf-pv">
          {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3" id="tf-extras">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Note (Optional)</label>
          <input
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="Memo / Transfer note"
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
            id="tf-note"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-emerald-600 transition"
            id="tf-date"
          />
        </div>
      </div>

      <button
        onClick={() => {
          const transferAmount = parseAmount(formAmountStr);
          if (!transferAmount || !formSelectedId || !formSelectedId2 || formSelectedId === formSelectedId2) return;

          if (transfer) {
            editTransfer(transfer.id, formSelectedId, formSelectedId2, transferAmount, formDate, formNote.trim());
          } else {
            addTransfer(formSelectedId, formSelectedId2, transferAmount, formDate, formNote.trim());
          }
          closeSheet();
          showToast(isEdit ? 'Transfer details updated' : `Transferred ${fmtIDR(transferAmount)} successfully`, null, undefined);
        }}
        disabled={!formSelectedId || !formSelectedId2 || formSelectedId === formSelectedId2 || !parseAmount(formAmountStr)}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1.5"
        id="tf-submit-btn"
      >
        {isEdit ? 'Save Transfer' : 'Transfer Funds'}
      </button>
    </div>
  );
};
