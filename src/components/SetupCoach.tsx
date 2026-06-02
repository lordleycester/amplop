/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Banknote, Check, Landmark, ReceiptText, Target, X } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import type { Category } from '../types';

export type SetupStep = 'targets' | 'accounts' | 'assign' | 'transactions';

interface SetupCoachProps {
  step: SetupStep;
  onStepChange: (step: SetupStep) => void;
  onSetTarget: (category: Category) => void;
  onAddAccount: () => void;
  onAssignMoney: () => void;
  onAddTransaction: () => void;
  onDismiss: () => void;
}

const stepOrder: SetupStep[] = ['targets', 'accounts', 'assign', 'transactions'];

export const SetupCoach: React.FC<SetupCoachProps> = ({
  step,
  onStepChange,
  onSetTarget,
  onAddAccount,
  onAssignMoney,
  onAddTransaction,
  onDismiss
}) => {
  const { state } = useBudget();
  const currentIndex = stepOrder.indexOf(step);
  const firstTargetCandidate = state.categories.find(c => !c.target) || state.categories[0];

  const goNext = () => {
    const next = stepOrder[currentIndex + 1];
    if (next) {
      onStepChange(next);
      return;
    }
    onDismiss();
  };

  const content = {
    targets: {
      icon: Target,
      eyebrow: 'Step 1 of 4',
      title: 'Set your targets',
      body: 'Targets are the plan: what rent, food, savings, subscriptions, and debt should need in a normal month.',
      action: firstTargetCandidate ? 'Set or Review a Target' : 'Add Categories First',
      onAction: () => {
        if (firstTargetCandidate) onSetTarget(firstTargetCandidate);
      },
      next: 'Next: Add Accounts'
    },
    accounts: {
      icon: Landmark,
      eyebrow: 'Step 2 of 4',
      title: 'Add your accounts',
      body: 'Now tell Amplop what money actually exists: bank, cash, savings, and any credit cards.',
      action: 'Add an Account',
      onAction: onAddAccount,
      next: 'Next: Assign Money'
    },
    assign: {
      icon: Banknote,
      eyebrow: 'Step 3 of 4',
      title: 'Assign the money you have',
      body: 'Fund the highest-priority targets first.',
      action: 'Go to Budget',
      onAction: onAssignMoney,
      next: 'Next: Add Transactions'
    },
    transactions: {
      icon: ReceiptText,
      eyebrow: 'Step 4 of 4',
      title: 'Add actual transactions',
      body: 'When money comes in or goes out, record it so your envelopes stay honest.',
      action: 'Add a Transaction',
      onAction: onAddTransaction,
      next: 'Finish Setup'
    }
  }[step];

  const Icon = content.icon;

  return (
    <div className="bg-white border-b-[3px] border-gray-900 p-3 select-none" id="setup-coach">
      <div className="border-2 border-gray-900 bg-slate-50 shadow-[3px_3px_0_#1E1E1E]">
        <div className="flex items-start gap-3 p-3">
          <div className="w-9 h-9 shrink-0 bg-amber-500 text-white border-2 border-gray-900 flex items-center justify-center">
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em]">{content.eyebrow}</div>
            <h3 className="text-sm font-bold text-gray-900 mt-0.5">{content.title}</h3>
            <p className="text-xs leading-relaxed text-gray-500 mt-1">{content.body}</p>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-900 transition"
            id="setup-coach-dismiss"
            aria-label="Dismiss setup guide"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 px-3 pb-3" id="setup-coach-progress">
          {stepOrder.map((stepName, index) => (
            <div
              key={stepName}
              className={`h-1.5 border border-gray-900 ${index <= currentIndex ? 'bg-amber-500' : 'bg-white'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-2 border-t-2 border-gray-900 p-3">
          <button
            onClick={content.onAction}
            disabled={step === 'targets' && !firstTargetCandidate}
            className="py-2 px-3 bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 disabled:opacity-40"
            id="setup-coach-action"
          >
            {content.action}
          </button>
          <button
            onClick={goNext}
            className="py-2 px-3 bg-white text-gray-900 border-2 border-gray-900 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5"
            id="setup-coach-next"
          >
            {currentIndex === stepOrder.length - 1 ? <Check size={13} /> : <ArrowRight size={13} />}
            {content.next}
          </button>
        </div>
      </div>
    </div>
  );
};
