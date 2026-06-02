/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import { installmentPaidMonths } from '../../utils/sharedUtils';
import type { Installment } from '../../types';
import type {
  AmountFormState,
  BasicFormState,
  ConfirmCallback,
  InstallmentFormState,
  NoteFormState,
  SecondSelectFormState,
  SelectFormState,
  SheetCallbacks
} from './SheetFormProps';

interface InstallmentFormProps
  extends BasicFormState,
    AmountFormState,
    SelectFormState,
    SecondSelectFormState,
    InstallmentFormState,
    NoteFormState,
    SheetCallbacks {
  installment?: Installment;
}

interface InstallmentDetailSheetProps extends SheetCallbacks, ConfirmCallback {
  installment: Installment;
  onEditInstallment: (installment: Installment) => void;
}

function calculateMonthlyPayment(totalValue: string, monthsValue: string): string | null {
  const total = parseAmount(totalValue);
  const months = parseInt(monthsValue) || 0;
  return total && months > 0 ? String(Math.ceil(total / months)) : null;
}

function calculateMonthCount(totalValue: string, monthlyValue: string): string | null {
  const total = parseAmount(totalValue);
  const monthly = parseAmount(monthlyValue);
  return total && monthly > 0 ? String(Math.ceil(total / monthly)) : null;
}

const InstallmentFields: React.FC<InstallmentFormProps & { mode: 'add' | 'edit' }> = ({
  mode,
  formName,
  setFormName,
  formSelectedId,
  setFormSelectedId,
  formSelectedId2,
  setFormSelectedId2,
  formAmountStr,
  setFormAmountStr,
  formCountMonths,
  setFormCountMonths,
  formMonthlyPaymentStr,
  setFormMonthlyPaymentStr,
  formTargetMonth,
  setFormTargetMonth,
  formNote,
  setFormNote
}) => {
  const { state } = useBudget();
  const isAdd = mode === 'add';

  return (
    <>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">{isAdd ? 'Nama Item' : 'Item Name'}</label>
        <input
          type="text"
          autoFocus={isAdd}
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder={isAdd ? 'e.g. iPhone, Kulkas, Laptop' : undefined}
          className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
          id={isAdd ? 'inst-name' : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">{isAdd ? 'Kartu Kredit / Akun' : 'Credit Card / Account'}</label>
          <select
            value={formSelectedId}
            onChange={(e) => setFormSelectedId(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
            id={isAdd ? 'inst-acc' : undefined}
          >
            <option value="">Select Account</option>
            {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">{isAdd ? 'Kategori Anggaran' : 'Budget Category'}</label>
          <select
            value={formSelectedId2}
            onChange={(e) => setFormSelectedId2(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
            id={isAdd ? 'inst-cat' : undefined}
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
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Total Harga (Rp)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formAmountStr}
          onChange={(e) => {
            setFormAmountStr(e.target.value);
            const monthlyPayment = calculateMonthlyPayment(e.target.value, formCountMonths);
            if (monthlyPayment) setFormMonthlyPaymentStr(monthlyPayment);
          }}
          placeholder={isAdd ? 'e.g. 12M' : undefined}
          className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
          id={isAdd ? 'inst-total' : undefined}
        />
        <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id={isAdd ? 'inst-total-pv' : undefined}>
          {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3" id={isAdd ? 'inst-duration-form' : undefined}>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Jumlah Bulan (Tenor)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formCountMonths}
            onChange={(e) => {
              setFormCountMonths(e.target.value);
              const monthlyPayment = calculateMonthlyPayment(formAmountStr, e.target.value);
              if (monthlyPayment) setFormMonthlyPaymentStr(monthlyPayment);
            }}
            placeholder={isAdd ? '12' : undefined}
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono select-all outline-none focus:border-emerald-600 transition"
            id={isAdd ? 'inst-months' : undefined}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Per Bulan (Rp)</label>
          <input
            type="text"
            inputMode="decimal"
            value={formMonthlyPaymentStr}
            onChange={(e) => {
              setFormMonthlyPaymentStr(e.target.value);
              const monthCount = calculateMonthCount(formAmountStr, e.target.value);
              if (monthCount) setFormCountMonths(monthCount);
            }}
            placeholder={isAdd ? 'auto' : undefined}
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono select-all outline-none focus:border-emerald-600 transition"
            id={isAdd ? 'inst-monthly' : undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3" id={isAdd ? 'inst-details-extras' : undefined}>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Bulan Pertama</label>
          <input
            type="month"
            value={formTargetMonth}
            onChange={(e) => setFormTargetMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
            id={isAdd ? 'inst-start' : undefined}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Catatan (Optional)</label>
          <input
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder={isAdd ? 'Note / promo 0%' : undefined}
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
            id={isAdd ? 'inst-note' : undefined}
          />
        </div>
      </div>
    </>
  );
};

export const AddInstallmentForm: React.FC<InstallmentFormProps> = (props) => {
  const { addInstallment } = useBudget();

  return (
    <div className="space-y-4 font-sans" id="form-add-installment">
      <InstallmentFields {...props} mode="add" />
      <button
        onClick={() => {
          const totalAmount = parseAmount(props.formAmountStr);
          const tenorMonths = parseInt(props.formCountMonths) || 0;
          const monthlyCharge = parseAmount(props.formMonthlyPaymentStr) || (tenorMonths > 0 ? Math.ceil(totalAmount / tenorMonths) : 0);

          if (!props.formName.trim() || !totalAmount || tenorMonths <= 0 || monthlyCharge <= 0) return;

          addInstallment(
            props.formName.trim(),
            '',
            props.formSelectedId || null,
            props.formSelectedId2 || null,
            totalAmount,
            tenorMonths,
            monthlyCharge,
            props.formTargetMonth,
            props.formNote.trim()
          );
          props.closeSheet();
          props.showToast(`Installment "${props.formName}" added successfully!`, null, undefined);
        }}
        disabled={!props.formName.trim() || !parseAmount(props.formAmountStr) || !parseInt(props.formCountMonths)}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
        id="inst-submit-btn"
      >
        Add New Installment
      </button>
    </div>
  );
};

export const EditInstallmentForm: React.FC<InstallmentFormProps> = (props) => {
  const { editInstallment } = useBudget();

  return (
    <div className="space-y-4" id="form-edit-installment">
      <InstallmentFields {...props} mode="edit" />
      <button
        onClick={() => {
          if (!props.installment || !props.formName.trim()) return;
          const totalAmount = parseAmount(props.formAmountStr);
          const durationMonths = parseInt(props.formCountMonths) || 0;
          const monthlyCharge = parseAmount(props.formMonthlyPaymentStr) || (durationMonths > 0 ? Math.ceil(totalAmount / durationMonths) : 0);

          if (!totalAmount || durationMonths <= 0 || monthlyCharge <= 0) {
            props.showToast('Please enter valid total amount and tenor duration months', 'error', undefined);
            return;
          }

          editInstallment(
            props.installment.id,
            props.formName.trim(),
            '',
            props.formSelectedId || null,
            props.formSelectedId2 || null,
            totalAmount,
            monthlyCharge,
            durationMonths,
            props.formTargetMonth,
            props.formNote.trim()
          );
          props.closeSheet();
          props.showToast('Installment updated', null, undefined);
        }}
        disabled={!props.formName.trim() || !parseAmount(props.formAmountStr) || !parseInt(props.formCountMonths)}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
      >
        Save
      </button>
    </div>
  );
};

export const InstallmentDetailSheet: React.FC<InstallmentDetailSheetProps> = ({
  installment,
  closeSheet,
  showToast,
  showConfirm,
  onEditInstallment
}) => {
  const { viewMonth, markInstallmentPaidOff, deleteInstallment } = useBudget();
  const paidCount = installmentPaidMonths(installment, viewMonth);
  const remainingCount = Math.max(0, installment.totalMonths - paidCount);

  return (
    <div className="space-y-4" id="installment-sheet-view">
      <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/50 space-y-2 select-none" id="inst-sheet-stats">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-medium">Total Cost</span>
          <span className="font-bold text-gray-800 font-mono">{fmtIDR(installment.totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
          <span className="text-gray-400 font-medium">Monthly Payment</span>
          <span className="font-semibold text-amber-600 font-mono">{fmtIDR(installment.monthlyPayment)} × {installment.totalMonths} mo</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
          <span className="text-gray-400 font-medium font-sans">Paid Amount</span>
          <span className="font-bold text-emerald-700 font-mono">{fmtIDR(installment.monthlyPayment * paidCount)} ({paidCount} mo)</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
          <span className="text-gray-400 font-medium text-sans">Remaining Balance</span>
          <span className="font-bold text-red-650 font-mono">{fmtIDR(installment.monthlyPayment * remainingCount)} ({remainingCount} mo)</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2" id="inst-detail-actions">
        <button
          onClick={() => {
            showConfirm('Mark as Paid Off?', 'Stop upcoming automatically scheduled installments billing transactions after this month immediately?', () => {
              markInstallmentPaidOff(installment.id);
              closeSheet();
              showToast('Installment marked as paid off', null, undefined);
            });
          }}
          className="w-full py-2 px-3 border border-emerald-800/10 text-emerald-850 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          Mark as Paid Off
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEditInstallment(installment)}
            className="py-2 px-3 border border-slate-200 text-gray-700 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
          >
            Edit details
          </button>
          <button
            onClick={() => {
              showConfirm(`Delete "${installment.name}"?`, `All upcoming transactions represent future obligations will be deleted. Past entered payments can be kept.`, () => {
                deleteInstallment(installment.id, false);
                closeSheet();
                showToast('Installment deleted', null, undefined);
              });
            }}
            className="py-2 px-3 border border-red-500/10 text-red-650 hover:bg-red-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
          >
            Delete Installment
          </button>
        </div>
      </div>
    </div>
  );
};
