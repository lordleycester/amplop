/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BasicFormState {
  formName: string;
  setFormName: (value: string) => void;
}

export interface SelectFormState {
  formSelectedId: string;
  setFormSelectedId: (value: string) => void;
}

export interface SecondSelectFormState {
  formSelectedId2: string;
  setFormSelectedId2: (value: string) => void;
}

export interface AmountFormState {
  formAmountStr: string;
  setFormAmountStr: (value: string) => void;
}

export interface DateFormState {
  formDate: string;
  setFormDate: (value: string) => void;
}

export interface NoteFormState {
  formNote: string;
  setFormNote: (value: string) => void;
}

export interface QuickAddFilterState {
  qaSelectedGroupId: string;
  setQaSelectedGroupId: (value: string) => void;
}

export interface InstallmentFormState {
  formCountMonths: string;
  setFormCountMonths: (value: string) => void;
  formMonthlyPaymentStr: string;
  setFormMonthlyPaymentStr: (value: string) => void;
  formTargetMonth: string;
  setFormTargetMonth: (value: string) => void;
}

export interface RecurringFormState {
  formRecurringType: 'expense' | 'income';
  setFormRecurringType: (value: 'expense' | 'income') => void;
  formDayOfMonth: string;
  setFormDayOfMonth: (value: string) => void;
}

export interface RepeatMonthlyState {
  formRepeatMonthly: boolean;
  setFormRepeatMonthly: (value: boolean) => void;
}

export interface TargetFormState {
  formTargetType: 'none' | 'monthly' | 'monthly_builder' | 'by_date';
  setFormTargetType: (value: 'none' | 'monthly' | 'monthly_builder' | 'by_date') => void;
  formTargetMonth: string;
  setFormTargetMonth: (value: string) => void;
}

export interface SheetCallbacks {
  closeSheet: () => void;
  showToast: (message: string, actionLabel?: string | null, onAction?: (() => void) | null) => void;
}

export interface ConfirmCallback {
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}
