/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import type { Account, Category, Group, Income, Installment, Recurring, SheetState, SheetType, Transaction, Transfer } from '../types';

type SheetPayloadMap = {
  add_category: string;
  edit_group: Group;
  edit_category: Category;
  category_detail: Category;
  set_target: Category;
  move_money: Category;
  edit_account: Account;
  account_detail: Account;
  edit_installment: Installment;
  installment_detail: Installment;
  edit_recurring: Recurring;
  transaction_detail: Transaction;
  edit_expense: Transaction;
  income_detail: Income;
  transfer_detail: Transfer;
};

type SheetWithPayload = keyof SheetPayloadMap;
type SheetWithoutPayload = Exclude<SheetType, SheetWithPayload>;

export type OpenSheet = {
  <T extends SheetWithoutPayload>(type: T, title: string): void;
  <T extends SheetWithPayload>(type: T, title: string, data: SheetPayloadMap[T]): void;
};

export const useSheetController = () => {
  const [sheet, setSheet] = useState<SheetState>({
    isOpen: false,
    title: '',
    type: 'quick_add'
  });

  const openSheet = ((type: SheetType, title: string, data?: SheetPayloadMap[SheetWithPayload]) => {
    setSheet((data === undefined ? { isOpen: true, title, type } : { isOpen: true, title, type, data }) as SheetState);
  }) as OpenSheet;

  const closeSheet = () => {
    setSheet(prev => ({ ...prev, isOpen: false }));
  };

  return {
    sheet,
    openSheet,
    closeSheet
  };
};
