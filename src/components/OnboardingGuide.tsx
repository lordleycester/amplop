/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Banknote, CheckCircle2, ListChecks, PiggyBank, X } from 'lucide-react';

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBudgeting: () => void;
  onSkipSurvey: () => void;
}

const steps = [
  {
    icon: Banknote,
    title: 'Start with real money',
    body: 'Add your bank, cash, and card accounts. Amplop treats money you already have as the pile you can give jobs to.'
  },
  {
    icon: PiggyBank,
    title: 'Fill the envelopes',
    body: 'Assign that money into categories like rent, groceries, savings, or subscriptions until Ready to Assign reaches zero.'
  },
  {
    icon: ListChecks,
    title: 'Spend from a category',
    body: 'When you record an expense, choose the account it came from and the envelope it should reduce.'
  },
  {
    icon: CheckCircle2,
    title: 'Adjust as life happens',
    body: 'If one envelope runs short, move money from another.'
  }
];

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ isOpen, onClose, onStartBudgeting, onSkipSurvey }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 z-[90] p-4 flex items-center justify-center"
            id="onboarding-backdrop"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[448px] max-h-[88vh] overflow-y-auto bg-slate-50 border-[3px] border-gray-900 shadow-[8px_8px_0_#1E1E1E]"
              id="onboarding-panel"
            >
              <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between border-b-[3px] border-gray-900">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/60">Quick start</div>
                  <h2 className="text-xl font-bold tracking-tight !text-white">Budget every rupiah</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
                  id="onboarding-close-btn"
                  aria-label="Close guide"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-5 py-5 space-y-5">
                <div className="bg-white border-2 border-gray-900 p-4 shadow-[3px_3px_0_#1E1E1E]">
                  <p className="text-sm font-semibold leading-relaxed text-gray-800">
                    Zero-based envelope budgeting means every rupiah gets a job before you spend it.
                  </p>
                  <p className="text-xs leading-relaxed text-gray-500 mt-2">
                    That doesn&apos;t mean you spend everything. Investments, debt payoff, and emergency funds are jobs too.
                  </p>
                </div>

                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="bg-white border-2 border-gray-900 p-3 flex gap-3 shadow-[2px_2px_0_#1E1E1E]">
                        <div className="w-9 h-9 shrink-0 bg-amber-500 text-white border-2 border-gray-900 flex items-center justify-center font-bold">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                            <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
                          </div>
                          <p className="text-xs leading-relaxed text-gray-500 mt-1">{step.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={onStartBudgeting}
                    className="w-full py-3 px-4 bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                    id="onboarding-done-btn"
                  >
                    Start with Category Survey
                    <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={onSkipSurvey}
                    className="w-full py-3 px-4 bg-white border-2 border-gray-900 text-gray-900 font-bold text-xs transition flex items-center justify-center gap-2"
                    id="onboarding-skip-survey-btn"
                  >
                    Skip Survey
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
