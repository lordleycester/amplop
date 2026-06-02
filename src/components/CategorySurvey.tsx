/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, X } from 'lucide-react';

export interface StarterCategoryInput {
  name: string;
  groupId: string;
}

interface CategorySurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (categories: StarterCategoryInput[]) => void;
}

type GroupId = 'needs' | 'wants' | 'subscriptions' | 'debt' | 'savings';

interface GeneratedCategory {
  name: string;
  groupId: GroupId;
}

interface SurveyOption {
  id: string;
  label: string;
  none?: boolean;
  categories: GeneratedCategory[];
}

interface SurveyQuestion {
  id: string;
  title: string;
  options: SurveyOption[];
}

interface DraftCategory extends GeneratedCategory {
  draftId: string;
  kept: boolean;
}

const groups: { id: GroupId; name: string }[] = [
  { id: 'needs', name: 'Needs' },
  { id: 'wants', name: 'Wants' },
  { id: 'subscriptions', name: 'Subscriptions' },
  { id: 'debt', name: 'Debt' },
  { id: 'savings', name: 'Savings Goals' }
];

const questions: SurveyQuestion[] = [
  {
    id: 'household',
    title: 'Who is in your household?',
    options: [
      { id: 'myself', label: 'Myself', categories: [] },
      { id: 'partner', label: 'My partner', categories: [{ groupId: 'needs', name: 'Shared Household' }, { groupId: 'wants', name: 'Date Nights' }] },
      { id: 'other_adults', label: 'Other adults', categories: [{ groupId: 'needs', name: 'Shared Household' }] },
      { id: 'teens', label: 'Teens', categories: [{ groupId: 'needs', name: 'School' }, { groupId: 'wants', name: 'Teen Activities' }, { groupId: 'wants', name: 'Clothing' }] },
      { id: 'kids', label: 'Kids', categories: [{ groupId: 'needs', name: 'Childcare' }, { groupId: 'needs', name: 'School' }, { groupId: 'wants', name: 'Kids Activities' }, { groupId: 'wants', name: 'Kids Clothing' }] },
      { id: 'pets', label: 'Pets', categories: [{ groupId: 'needs', name: 'Pet Food' }, { groupId: 'needs', name: 'Vet and Medicine' }, { groupId: 'wants', name: 'Pet Supplies' }] }
    ]
  },
  {
    id: 'home',
    title: 'Tell us about your home.',
    options: [
      { id: 'rent', label: 'I rent', categories: [{ groupId: 'needs', name: 'Rent' }, { groupId: 'needs', name: 'Utilities' }, { groupId: 'needs', name: 'Home Supplies' }] },
      { id: 'own', label: 'I own', categories: [{ groupId: 'needs', name: 'Mortgage' }, { groupId: 'needs', name: 'Utilities' }, { groupId: 'needs', name: 'Home Maintenance' }, { groupId: 'needs', name: 'Property Tax' }, { groupId: 'needs', name: 'Home Insurance' }, { groupId: 'needs', name: 'Home Supplies' }] },
      { id: 'other', label: 'Other', categories: [{ groupId: 'needs', name: 'Housing Contribution' }, { groupId: 'needs', name: 'Home Supplies' }] }
    ]
  },
  {
    id: 'debt',
    title: 'Do you currently have any debt?',
    options: [
      { id: 'credit_card', label: 'Credit card', categories: [{ groupId: 'debt', name: 'Credit Card Payment' }] },
      { id: 'auto_loans', label: 'Auto loans', categories: [{ groupId: 'debt', name: 'Auto Loan' }] },
      { id: 'personal_loans', label: 'Personal loans', categories: [{ groupId: 'debt', name: 'Personal Loan' }] },
      { id: 'pinjol', label: 'Pinjol', categories: [{ groupId: 'debt', name: 'Pinjol' }] },
      { id: 'bnpl', label: 'Buy now, pay later', categories: [{ groupId: 'debt', name: 'Buy Now Pay Later' }] },
      { id: 'none', label: 'I do not currently have debt', none: true, categories: [] }
    ]
  },
  {
    id: 'transport',
    title: 'How do you get around?',
    options: [
      { id: 'car', label: 'Car', categories: [{ groupId: 'needs', name: 'Fuel' }, { groupId: 'needs', name: 'Parking and Tolls' }, { groupId: 'needs', name: 'Car Maintenance' }, { groupId: 'needs', name: 'Vehicle Registration' }, { groupId: 'needs', name: 'Vehicle Insurance' }] },
      { id: 'motorcycle', label: 'Motorcycle', categories: [{ groupId: 'needs', name: 'Fuel' }, { groupId: 'needs', name: 'Parking and Tolls' }, { groupId: 'needs', name: 'Motorcycle Maintenance' }, { groupId: 'needs', name: 'Vehicle Registration' }, { groupId: 'needs', name: 'Vehicle Insurance' }] },
      { id: 'bike', label: 'Bike', categories: [{ groupId: 'needs', name: 'Bike Maintenance' }] },
      { id: 'walk', label: 'Walk', categories: [] },
      { id: 'public_transit', label: 'Public transit', categories: [{ groupId: 'needs', name: 'Public Transit' }] },
      { id: 'gojek_grab', label: 'Gojek/Grab', categories: [{ groupId: 'needs', name: 'Gojek/Grab' }] },
      { id: 'none', label: 'None of these apply to me', none: true, categories: [] }
    ]
  },
  {
    id: 'regular_spending',
    title: 'Which of these do you regularly spend money on?',
    options: [
      { id: 'groceries', label: 'Groceries', categories: [{ groupId: 'needs', name: 'Groceries' }] },
      { id: 'phone', label: 'Phone', categories: [{ groupId: 'needs', name: 'Phone' }] },
      { id: 'internet', label: 'Internet', categories: [{ groupId: 'needs', name: 'Internet' }] },
      { id: 'tv_cable', label: 'TV/Cable', categories: [{ groupId: 'needs', name: 'TV/Cable' }] },
      { id: 'personal_care', label: 'Personal care', categories: [{ groupId: 'needs', name: 'Personal Care' }] },
      { id: 'clothing', label: 'Clothing', categories: [{ groupId: 'wants', name: 'Clothing' }] },
      { id: 'none', label: 'None of these apply to me', none: true, categories: [] }
    ]
  },
  {
    id: 'domestic_services',
    title: 'Which of these domestic services do you use?',
    options: [
      { id: 'prt', label: 'Pekerja Rumah Tangga', categories: [{ groupId: 'needs', name: 'Pekerja Rumah Tangga' }] },
      { id: 'laundry', label: 'Laundry', categories: [{ groupId: 'needs', name: 'Laundry' }] },
      { id: 'cleaning_service', label: 'Cleaning Service', categories: [{ groupId: 'needs', name: 'Cleaning Service' }] },
      { id: 'driver', label: 'Driver', categories: [{ groupId: 'needs', name: 'Driver' }] },
      { id: 'gardener', label: 'Gardener', categories: [{ groupId: 'needs', name: 'Gardener' }] },
      { id: 'none', label: 'None of these apply to me', none: true, categories: [] }
    ]
  },
  {
    id: 'subscriptions',
    title: 'Which of these subscriptions do you have?',
    options: [
      { id: 'music', label: 'Music', categories: [{ groupId: 'subscriptions', name: 'Music' }] },
      { id: 'tv_streaming', label: 'TV streaming', categories: [{ groupId: 'subscriptions', name: 'TV Streaming' }] },
      { id: 'fitness', label: 'Fitness', categories: [{ groupId: 'subscriptions', name: 'Fitness' }] },
      { id: 'other', label: 'Other subscriptions', categories: [{ groupId: 'subscriptions', name: 'Other Subscriptions' }] },
      { id: 'none', label: 'I do not subscribe to any of these', none: true, categories: [] }
    ]
  },
  {
    id: 'irregular',
    title: 'What less frequent expenses do you need to prepare for?',
    options: [
      { id: 'card_fees', label: 'Annual credit card fees', categories: [{ groupId: 'needs', name: 'Annual Card Fees' }] },
      { id: 'medical', label: 'Medical expenses', categories: [{ groupId: 'needs', name: 'Medical Expenses' }] },
      { id: 'taxes', label: 'Taxes or other fees', categories: [{ groupId: 'needs', name: 'Taxes and Fees' }] },
      { id: 'none', label: 'None of these apply to me', none: true, categories: [] }
    ]
  },
  {
    id: 'goals',
    title: 'What goals do you want to prioritize?',
    options: [
      { id: 'vacation', label: 'Dream vacation', categories: [{ groupId: 'savings', name: 'Vacation' }] },
      { id: 'new_car', label: 'New car', categories: [{ groupId: 'savings', name: 'New Car' }] },
      { id: 'new_home', label: 'New home', categories: [{ groupId: 'savings', name: 'New Home' }] },
      { id: 'wedding', label: 'Wedding', categories: [{ groupId: 'savings', name: 'Wedding' }] },
      { id: 'new_baby', label: 'New baby', categories: [{ groupId: 'savings', name: 'Baby Fund' }] },
      { id: 'emergency', label: 'Emergency fund', categories: [{ groupId: 'savings', name: 'Emergency Fund' }] },
      { id: 'retirement', label: 'Retirement or investments', categories: [{ groupId: 'savings', name: 'Retirement and Investments' }] },
      { id: 'none', label: 'I do not save for any of these', none: true, categories: [] }
    ]
  },
  {
    id: 'wants',
    title: 'What else do you want to include in your plan?',
    options: [
      { id: 'dining', label: 'Dining out', categories: [{ groupId: 'wants', name: 'Dining Out' }] },
      { id: 'entertainment', label: 'Entertainment', categories: [{ groupId: 'wants', name: 'Entertainment' }] },
      { id: 'hobbies', label: 'Hobbies', categories: [{ groupId: 'wants', name: 'Hobbies' }] },
      { id: 'charity', label: 'Charity', categories: [{ groupId: 'wants', name: 'Giving' }] },
      { id: 'holidays', label: 'Holidays and gifts', categories: [{ groupId: 'wants', name: 'Holidays and Gifts' }] },
      { id: 'decor', label: 'Decor and garden', categories: [{ groupId: 'wants', name: 'Decor and Garden' }] }
    ]
  }
];

const makeDraft = (selected: Record<string, string[]>): DraftCategory[] => {
  const seen = new Set<string>();
  const draft: DraftCategory[] = [];

  questions.forEach(question => {
    const selectedOptions = question.options.filter(option => selected[question.id]?.includes(option.id));
    selectedOptions.forEach(option => {
      option.categories.forEach(category => {
        const key = `${category.groupId}:${category.name.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        draft.push({
          ...category,
          draftId: key.replace(/[^a-z0-9]+/g, '_'),
          kept: true
        });
      });
    });
  });

  return draft;
};

export const CategorySurvey: React.FC<CategorySurveyProps> = ({ isOpen, onClose, onApply }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const question = questions[questionIndex];
  const progress = isReviewing ? 100 : ((questionIndex + 1) / questions.length) * 100;
  const keptCategories = useMemo(
    () => draftCategories.filter(category => category.kept && category.name.trim()),
    [draftCategories]
  );

  if (!isOpen) return null;

  const toggleOption = (option: SurveyOption) => {
    setSelected(prev => {
      const current = prev[question.id] || [];
      if (option.none) {
        return { ...prev, [question.id]: current.includes(option.id) ? [] : [option.id] };
      }

      const withoutNone = current.filter(id => !question.options.find(qOption => qOption.id === id)?.none);
      const next = withoutNone.includes(option.id)
        ? withoutNone.filter(id => id !== option.id)
        : [...withoutNone, option.id];
      return { ...prev, [question.id]: next };
    });
  };

  const goNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(index => index + 1);
      return;
    }
    setDraftCategories(makeDraft(selected));
    setIsReviewing(true);
  };

  const goBack = () => {
    if (isReviewing) {
      setIsReviewing(false);
      return;
    }
    setQuestionIndex(index => Math.max(0, index - 1));
  };

  const updateDraft = (draftId: string, update: Partial<DraftCategory>) => {
    setDraftCategories(prev => prev.map(category => category.draftId === draftId ? { ...category, ...update } : category));
  };

  const addDraftCategory = () => {
    const draftId = `custom_${Date.now()}`;
    setDraftCategories(prev => [...prev, { draftId, groupId: 'needs', name: 'New Category', kept: true }]);
  };

  const applyDraft = () => {
    onApply(keptCategories.map(category => ({ name: category.name.trim(), groupId: category.groupId })));
  };

  return (
    <div className="fixed inset-0 bg-black/55 z-[95] p-4 flex items-center justify-center" id="category-survey-backdrop">
      <div className="w-full max-w-[448px] max-h-[88vh] overflow-hidden bg-slate-50 border-[3px] border-gray-900 shadow-[8px_8px_0_#1E1E1E] flex flex-col" id="category-survey-panel">
        <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between border-b-[3px] border-gray-900">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/60">
              {isReviewing ? 'Review plan' : `Question ${questionIndex + 1} of ${questions.length}`}
            </div>
            <h2 className="text-xl font-bold tracking-tight !text-white">
              {isReviewing ? 'Your starter categories' : 'Build your envelopes'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
            id="category-survey-close"
            aria-label="Close category survey"
          >
            <X size={20} />
          </button>
        </div>

        <div className="h-2 bg-white border-b-2 border-gray-900">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {!isReviewing ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{question.title}</h3>
              <div className="grid grid-cols-1 gap-2">
                {question.options.map(option => {
                  const active = selected[question.id]?.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(option)}
                      className={`text-left p-3 border-2 border-gray-900 text-sm font-bold shadow-[2px_2px_0_#1E1E1E] transition ${
                        active ? 'bg-amber-500 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border-2 border-gray-900 p-3 shadow-[2px_2px_0_#1E1E1E]">
                <h3 className="text-sm font-bold text-gray-900">Review before saving</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  Remove anything that does not fit, rename categories, or move them to a different group.
                </p>
              </div>

              {groups.map(group => {
                const groupCategories = draftCategories.filter(category => category.groupId === group.id);
                if (!groupCategories.length) return null;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{group.name}</div>
                    {groupCategories.map(category => (
                      <div key={category.draftId} className={`bg-white border-2 border-gray-900 p-2 shadow-[2px_2px_0_#1E1E1E] ${category.kept ? '' : 'opacity-45'}`}>
                        <div className="grid grid-cols-[1fr_96px_30px] gap-2 items-center">
                          <input
                            type="text"
                            value={category.name}
                            onChange={(event) => updateDraft(category.draftId, { name: event.target.value })}
                            className="min-w-0 text-xs font-bold"
                            disabled={!category.kept}
                          />
                          <select
                            value={category.groupId}
                            onChange={(event) => updateDraft(category.draftId, { groupId: event.target.value as GroupId })}
                            className="text-[10px] font-bold"
                            disabled={!category.kept}
                          >
                            {groups.map(groupOption => (
                              <option key={groupOption.id} value={groupOption.id}>{groupOption.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateDraft(category.draftId, { kept: !category.kept })}
                            className="h-8 border-2 border-gray-900 bg-white flex items-center justify-center"
                            aria-label={category.kept ? 'Remove category' : 'Restore category'}
                          >
                            {category.kept ? <Trash2 size={14} /> : <Plus size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {draftCategories.length === 0 && (
                <div className="bg-white border-2 border-gray-900 p-5 text-center text-xs font-semibold text-gray-500">
                  No categories yet. Go back and select a few options, or add one manually.
                </div>
              )}

              <button
                onClick={addDraftCategory}
                className="w-full py-2.5 px-4 bg-white border-2 border-gray-900 text-gray-900 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2"
                id="category-survey-add-custom"
              >
                <Plus size={14} />
                Add Category
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 border-t-2 border-gray-900">
          <button
            onClick={goBack}
            disabled={!isReviewing && questionIndex === 0}
            className="py-3 px-4 bg-white border-2 border-gray-900 text-gray-900 font-bold text-xs uppercase tracking-wide disabled:opacity-30 flex items-center justify-center gap-2"
            id="category-survey-back"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            onClick={isReviewing ? applyDraft : goNext}
            className="py-3 px-4 bg-emerald-800 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2"
            id="category-survey-next"
          >
            {isReviewing ? <Check size={14} /> : <ArrowRight size={14} />}
            {isReviewing ? 'Save Plan' : questionIndex === questions.length - 1 ? 'Review' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
