/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import type { Account } from '../../types';
import type { AmountFormState, BasicFormState, SelectFormState, SheetCallbacks } from './SheetFormProps';

interface AccountFormProps extends BasicFormState, SelectFormState, AmountFormState, SheetCallbacks {
  account?: Account;
}

const AccountTypeOptions: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <>
    <optgroup label={compact ? 'Budget Accounts' : 'Budget Accounts (On-Budget)'}>
      <option value="checking">{compact ? 'Checking' : 'Checking / Bank Account'}</option>
      <option value="savings">Savings</option>
      <option value="credit_card">{compact ? 'Credit Card' : 'Credit Card (CC)'}</option>
      <option value="cash">{compact ? 'Cash' : 'Cash on Hand'}</option>
    </optgroup>
    <optgroup label={compact ? 'Tracking Accounts' : 'Tracking Accounts (Off-Budget)'}>
      <option value="investment">{compact ? 'Investment' : 'Investment Asset'}</option>
      <option value="retirement">{compact ? 'Retirement' : 'Retirement Fund'}</option>
      <option value="mortgage">{compact ? 'Mortgage' : 'Mortgage Loan / Debt'}</option>
      <option value="other_asset">Other Asset</option>
    </optgroup>
  </>
);

export const AddAccountForm: React.FC<AccountFormProps> = ({
  formName,
  setFormName,
  formSelectedId,
  setFormSelectedId,
  formAmountStr,
  setFormAmountStr,
  closeSheet,
  showToast
}) => {
  const { addAccount } = useBudget();

  return (
    <div className="space-y-4" id="form-add-account">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Name</label>
        <input
          type="text"
          autoFocus
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g. Mandiri, Cash on Hand"
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
          id="na-name"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Type</label>
        <select
          value={formSelectedId}
          onChange={(e) => setFormSelectedId(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
          id="na-type"
        >
          <AccountTypeOptions />
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Starting Balance (Rp)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formAmountStr}
          onChange={(e) => setFormAmountStr(e.target.value)}
          placeholder="0"
          className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
          id="na-balance"
        />
        <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="na-bal-pv">
          {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
        </div>
      </div>

      <button
        onClick={() => {
          if (!formName.trim()) return;
          const balanceVal = parseAmount(formAmountStr);
          const resolvedType = (formSelectedId || 'checking') as Account['type'];

          addAccount(formName.trim(), resolvedType, balanceVal);
          closeSheet();
          showToast(`Account "${formName}" created with ${fmtIDR(balanceVal)}`, null, undefined);
        }}
        disabled={!formName.trim()}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
        id="na-submit-btn"
      >
        Add Account
      </button>
    </div>
  );
};

export const EditAccountForm: React.FC<AccountFormProps> = ({
  account,
  formName,
  setFormName,
  formSelectedId,
  setFormSelectedId,
  formAmountStr,
  setFormAmountStr,
  closeSheet,
  showToast
}) => {
  const { editAccount } = useBudget();

  return (
    <div className="space-y-4 font-sans" id="form-edit-account">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Name</label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Type</label>
        <select
          value={formSelectedId}
          onChange={(e) => setFormSelectedId(e.target.value)}
          className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
        >
          <AccountTypeOptions compact />
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Starting Balance (Rp)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formAmountStr}
          onChange={(e) => setFormAmountStr(e.target.value)}
          className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
        />
      </div>

      <button
        onClick={() => {
          if (!formName.trim() || !account) return;
          const startingBal = parseAmount(formAmountStr);
          const resolvedType = (formSelectedId || 'checking') as Account['type'];

          editAccount(account.id, formName.trim(), resolvedType, startingBal);
          closeSheet();
          showToast('Account details updated', null, undefined);
        }}
        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
      >
        Save Changes
      </button>
    </div>
  );
};
