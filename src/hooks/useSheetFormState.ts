/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { todayMonth, todayStr } from '../utils/helpers';
import type { Recurring, SheetState } from '../types';

export const useSheetFormState = (sheet: SheetState, defaultCategoryGroupId: string) => {
  const [formName, setFormName] = useState('');
  const [formSelectedId, setFormSelectedId] = useState('');
  const [formSelectedId2, setFormSelectedId2] = useState('');
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formDate, setFormDate] = useState(todayStr());
  const [formNote, setFormNote] = useState('');
  const [formTargetType, setFormTargetType] = useState<'none' | 'monthly' | 'monthly_builder' | 'by_date'>('none');
  const [formTargetMonth, setFormTargetMonth] = useState(todayMonth());
  const [formCountMonths, setFormCountMonths] = useState('12');
  const [formMonthlyPaymentStr, setFormMonthlyPaymentStr] = useState('');
  const [formRecurringType, setFormRecurringType] = useState<'expense' | 'income'>('expense');
  const [formDayOfMonth, setFormDayOfMonth] = useState('1');
  const [formRepeatMonthly, setFormRepeatMonthly] = useState(false);
  const [qaSelectedGroupId, setQaSelectedGroupId] = useState('all');

  useEffect(() => {
    if (!sheet.isOpen) return;

    setFormName('');
    setFormSelectedId('');
    setFormSelectedId2('');
    setFormAmountStr('');
    setFormDate(todayStr());
    setFormNote('');
    setFormTargetType('none');
    setFormTargetMonth(todayMonth());
    setFormCountMonths('12');
    setFormMonthlyPaymentStr('');
    setFormRecurringType('expense');
    setFormDayOfMonth('1');
    setFormRepeatMonthly(false);
    setQaSelectedGroupId('all');

    switch (sheet.type) {
      case 'edit_category':
        setFormName(sheet.data.name);
        setFormSelectedId(sheet.data.groupId);
        break;
      case 'add_category':
        setFormSelectedId(sheet.data || defaultCategoryGroupId);
        break;
      case 'edit_group':
        setFormName(sheet.data.name);
        break;
      case 'set_target': {
        const target = sheet.data.target;
        if (target) {
          setFormTargetType(target.type);
          setFormAmountStr(String(target.amount));
          if (target.dueDate) setFormTargetMonth(target.dueDate);
        }
        break;
      }
      case 'edit_account':
        setFormName(sheet.data.name);
        setFormSelectedId(sheet.data.type);
        setFormAmountStr(String(sheet.data.startingBalance || 0));
        break;
      case 'edit_installment':
        setFormName(sheet.data.name);
        setFormSelectedId(sheet.data.accountId || '');
        setFormSelectedId2(sheet.data.catId || '');
        setFormAmountStr(String(sheet.data.totalAmount));
        setFormCountMonths(String(sheet.data.totalMonths));
        setFormMonthlyPaymentStr(String(sheet.data.monthlyPayment));
        setFormTargetMonth(sheet.data.startDate);
        setFormNote(sheet.data.note || '');
        break;
      case 'edit_expense':
        setFormAmountStr(String(sheet.data.amount));
        setFormSelectedId(sheet.data.catId || '');
        setFormSelectedId2(sheet.data.accountId || '');
        setFormDate(sheet.data.date);
        setFormNote(sheet.data.note || '');
        break;
      case 'edit_income':
        setFormAmountStr(String(sheet.data.amount));
        setFormSelectedId(sheet.data.accountId || '');
        setFormDate(sheet.data.date);
        setFormNote(sheet.data.note || '');
        break;
      case 'edit_transfer':
        setFormAmountStr(String(sheet.data.amount));
        setFormSelectedId(sheet.data.fromAccountId || '');
        setFormSelectedId2(sheet.data.toAccountId || '');
        setFormDate(sheet.data.date);
        setFormNote(sheet.data.note || '');
        break;
      case 'edit_recurring': {
        const recurring = sheet.data as Recurring;
        setFormRecurringType(recurring.type);
        setFormName(recurring.name);
        setFormAmountStr(String(recurring.amount));
        setFormSelectedId(recurring.catId || '');
        setFormSelectedId2(recurring.accountId || '');
        setFormDayOfMonth(String(recurring.dayOfMonth));
        setFormDate(recurring.startDate);
        setFormNote(recurring.endDate || '');
        break;
      }
    }
  }, [defaultCategoryGroupId, sheet]);

  return {
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
  };
};

export type SheetFormState = ReturnType<typeof useSheetFormState>;
