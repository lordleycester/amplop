/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { BottomSheet } from '../BottomSheet';
import { AccountDetailSheet } from './AccountDetailSheet';
import { AddAccountForm, EditAccountForm } from './AccountForms';
import { AddIncomeForm } from './AddIncomeForm';
import { AssignReadyToAssignForm } from './AssignReadyToAssignForm';
import { CategoryActivitySheet, CategoryDetailSheet, MoveMoneyForm, SetTargetForm } from './CategoryDetailSheets';
import { AddCategoryForm, EditCategoryForm } from './CategoryForms';
import { AddGroupForm, EditGroupForm } from './GroupForms';
import { AddInstallmentForm, EditInstallmentForm, InstallmentDetailSheet } from './InstallmentForms';
import { PayCreditCardForm } from './PayCreditCardForm';
import { QuickAddExpenseForm } from './QuickAddExpenseForm';
import { AddRecurringForm, EditRecurringForm } from './RecurringForms';
import { EditExpenseForm, EditIncomeForm, IncomeDetailSheet, TransactionDetailSheet, TransferDetailSheet } from './TransactionDetailSheets';
import { TransferForm } from './TransferForm';
import type { OpenSheet } from '../../hooks/useSheetController';
import type { SheetFormState } from '../../hooks/useSheetFormState';
import type { SheetState } from '../../types';

interface AppBottomSheetsProps {
  sheet: SheetState;
  form: SheetFormState;
  openSheet: OpenSheet;
  closeSheet: () => void;
  showToast: (message: string, actionLabel?: string | null, onAction?: (() => void) | null) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const AppBottomSheets: React.FC<AppBottomSheetsProps> = ({
  sheet,
  form,
  openSheet,
  closeSheet,
  showToast,
  showConfirm
}) => {
  const { deleteCategory } = useBudget();
  const {
    formName,
    setFormName,
    formSelectedId,
    setFormSelectedId,
    formSelectedId2,
    setFormSelectedId2,
    formAmountStr,
    setFormAmountStr,
    formDate,
    setFormDate,
    formNote,
    setFormNote,
    formTargetType,
    setFormTargetType,
    formTargetMonth,
    setFormTargetMonth,
    formCountMonths,
    setFormCountMonths,
    formMonthlyPaymentStr,
    setFormMonthlyPaymentStr,
    formRecurringType,
    setFormRecurringType,
    formDayOfMonth,
    setFormDayOfMonth,
    formRepeatMonthly,
    setFormRepeatMonthly,
    qaSelectedGroupId,
    setQaSelectedGroupId
  } = form;

  return (
    <BottomSheet
      isOpen={sheet.isOpen}
      onClose={closeSheet}
      title={sheet.title}
    >
      {sheet.type === 'add_group' && (
        <AddGroupForm
          formName={formName}
          setFormName={setFormName}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'edit_group' && (
        <EditGroupForm
          group={sheet.data}
          formName={formName}
          setFormName={setFormName}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'add_category' && (
        <AddCategoryForm
          formName={formName}
          setFormName={setFormName}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'edit_category' && (
        <EditCategoryForm
          category={sheet.data}
          formName={formName}
          setFormName={setFormName}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'category_detail' && sheet.data && (
        <CategoryDetailSheet
          category={sheet.data}
          onSetTarget={(category) => openSheet('set_target', `Set Target for ${category.name}`, category)}
          onMoveMoney={(category) => openSheet('move_money', `Move Money from ${category.name}`, category)}
          onEditCategory={(category) => openSheet('edit_category', 'Edit Category', category)}
          onDeleteCategory={(category) => showConfirm(
            `Delete Category "${category.name}"?`,
            'All spending transactions are kept but unassigned.',
            () => {
              deleteCategory(category.id);
              closeSheet();
              showToast(`Category "${category.name}" deleted`, null, undefined);
            }
          )}
        />
      )}

      {sheet.type === 'category_activity' && sheet.data && (
        <CategoryActivitySheet category={sheet.data} />
      )}

      {sheet.type === 'set_target' && sheet.data && (
        <SetTargetForm
          category={sheet.data}
          formTargetType={formTargetType}
          setFormTargetType={setFormTargetType}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formTargetMonth={formTargetMonth}
          setFormTargetMonth={setFormTargetMonth}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'move_money' && sheet.data && (
        <MoveMoneyForm
          sourceCategory={sheet.data}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'quick_add' && (
        <QuickAddExpenseForm
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          formRepeatMonthly={formRepeatMonthly}
          setFormRepeatMonthly={setFormRepeatMonthly}
          qaSelectedGroupId={qaSelectedGroupId}
          setQaSelectedGroupId={setQaSelectedGroupId}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'add_income' && (
        <AddIncomeForm
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          formRepeatMonthly={formRepeatMonthly}
          setFormRepeatMonthly={setFormRepeatMonthly}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'assign_rta' && (
        <AssignReadyToAssignForm
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'add_account' && (
        <AddAccountForm
          formName={formName}
          setFormName={setFormName}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'edit_account' && sheet.data && (
        <EditAccountForm
          account={sheet.data}
          formName={formName}
          setFormName={setFormName}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'account_detail' && sheet.data && (
        <AccountDetailSheet
          account={sheet.data}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          closeSheet={closeSheet}
          showToast={showToast}
          showConfirm={showConfirm}
          onEditAccount={(account) => openSheet('edit_account', 'Edit Account', account)}
        />
      )}

      {sheet.type === 'add_transfer' && (
        <TransferForm
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'edit_transfer' && sheet.data && (
        <TransferForm
          transfer={sheet.data}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'pay_credit_card' && (
        <PayCreditCardForm
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'add_installment' && (
        <AddInstallmentForm
          formName={formName}
          setFormName={setFormName}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formCountMonths={formCountMonths}
          setFormCountMonths={setFormCountMonths}
          formMonthlyPaymentStr={formMonthlyPaymentStr}
          setFormMonthlyPaymentStr={setFormMonthlyPaymentStr}
          formTargetMonth={formTargetMonth}
          setFormTargetMonth={setFormTargetMonth}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'edit_installment' && sheet.data && (
        <EditInstallmentForm
          installment={sheet.data}
          formName={formName}
          setFormName={setFormName}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formCountMonths={formCountMonths}
          setFormCountMonths={setFormCountMonths}
          formMonthlyPaymentStr={formMonthlyPaymentStr}
          setFormMonthlyPaymentStr={setFormMonthlyPaymentStr}
          formTargetMonth={formTargetMonth}
          setFormTargetMonth={setFormTargetMonth}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'installment_detail' && sheet.data && (
        <InstallmentDetailSheet
          installment={sheet.data}
          closeSheet={closeSheet}
          showToast={showToast}
          showConfirm={showConfirm}
          onEditInstallment={(installment) => openSheet('edit_installment', 'Edit Installment', installment)}
        />
      )}

      {sheet.type === 'add_recurring' && (
        <AddRecurringForm
          formName={formName}
          setFormName={setFormName}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          formRecurringType={formRecurringType}
          setFormRecurringType={setFormRecurringType}
          formDayOfMonth={formDayOfMonth}
          setFormDayOfMonth={setFormDayOfMonth}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'edit_recurring' && sheet.data && (
        <EditRecurringForm
          recurring={sheet.data}
          formName={formName}
          setFormName={setFormName}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          formRecurringType={formRecurringType}
          setFormRecurringType={setFormRecurringType}
          formDayOfMonth={formDayOfMonth}
          setFormDayOfMonth={setFormDayOfMonth}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'transaction_detail' && sheet.data && (
        <TransactionDetailSheet
          transaction={sheet.data}
          closeSheet={closeSheet}
          showToast={showToast}
          showConfirm={showConfirm}
          onEditExpense={(transaction) => openSheet('edit_expense', 'Edit Outflow Expense', transaction)}
        />
      )}

      {sheet.type === 'edit_expense' && sheet.data && (
        <EditExpenseForm
          transaction={sheet.data}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formSelectedId2={formSelectedId2}
          setFormSelectedId2={setFormSelectedId2}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'income_detail' && sheet.data && (
        <IncomeDetailSheet
          income={sheet.data}
          closeSheet={closeSheet}
          showToast={showToast}
          showConfirm={showConfirm}
          onEditIncome={(income) => openSheet('edit_income', 'Edit Income', income)}
        />
      )}

      {sheet.type === 'edit_income' && sheet.data && (
        <EditIncomeForm
          income={sheet.data}
          formAmountStr={formAmountStr}
          setFormAmountStr={setFormAmountStr}
          formSelectedId={formSelectedId}
          setFormSelectedId={setFormSelectedId}
          formDate={formDate}
          setFormDate={setFormDate}
          formNote={formNote}
          setFormNote={setFormNote}
          closeSheet={closeSheet}
          showToast={showToast}
        />
      )}

      {sheet.type === 'transfer_detail' && sheet.data && (
        <TransferDetailSheet
          transfer={sheet.data}
          closeSheet={closeSheet}
          showToast={showToast}
          showConfirm={showConfirm}
          onEditTransfer={(transfer) => openSheet('edit_transfer', 'Edit Transfer', transfer)}
        />
      )}
    </BottomSheet>
  );
};
