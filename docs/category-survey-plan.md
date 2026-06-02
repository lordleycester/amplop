# Category Starter Survey Plan

This document plans the onboarding survey that creates a starter set of budget categories before the user sets targets, adds accounts, and assigns money.

The survey should produce a draft plan, not a final budget. Users should be able to remove, rename, and add categories before saving the generated setup.

## Default Groups

Amplop should start with these groups:

- Needs
- Wants
- Subscriptions
- Debt
- Savings Goals

## Suggested Onboarding Order

1. Build categories from survey answers.
2. Review and edit the generated categories.
3. Set targets.
4. Add accounts.
5. Assign money.

## Category Creation Rules

- Only create categories from the user's selected survey answers.
- If multiple answers would create the same category, show it once.
- Categories should be placed in one of the default groups.
- The first survey should not ask for target amounts. Target setup comes next.
- If a user chooses a "none of these apply" option, do not create categories from that question.
- Do not add "base" categories automatically. If a category should exist, it should come from an answer the user picked.

## Question Mapping

### Who is in your household?

Options:

- Myself
- My partner
- Other adults
- Teens
- Kids
- Pets

Rules:

| Option | Categories to Create |
| --- | --- |
| Myself | No extra categories. |
| My partner | Needs: Shared Household; Wants: Date Nights |
| Other adults | Needs: Shared Household |
| Teens | Needs: School; Wants: Teen Activities; Wants: Clothing |
| Kids | Needs: Childcare; Needs: School; Wants: Kids Activities; Wants: Kids Clothing |
| Pets | Needs: Pet Food; Needs: Vet and Medicine; Wants: Pet Supplies |

Notes:

- "Shared Household" is for shared groceries, household basics, or split expenses that do not fit another category.
- "Clothing" and "Kids Clothing" are separate because they behave differently for many families.

### Tell us about your home.

Options:

- I rent
- I own
- Other

Rules:

| Option | Categories to Create |
| --- | --- |
| I rent | Needs: Rent; Needs: Utilities; Needs: Home Supplies |
| I own | Needs: Mortgage; Needs: Utilities; Needs: Home Maintenance; Needs: Property Tax; Needs: Home Insurance; Needs: Home Supplies |
| Other | Needs: Housing Contribution; Needs: Home Supplies |

Notes:

- If the user owns, "Property Tax" can be removed later if it does not apply in their country or situation.

### Do you currently have any debt?

Options:

- Credit card
- Auto loans
- Personal loans
- Pinjol
- Buy now, pay later
- I do not currently have debt

Rules:

| Option | Categories to Create |
| --- | --- |
| Credit card | Debt: Credit Card Payment |
| Auto loans | Debt: Auto Loan |
| Personal loans | Debt: Personal Loan |
| Pinjol | Debt: Pinjol |
| Buy now, pay later | Debt: Buy Now Pay Later |
| I do not currently have debt | No debt categories. |

Notes:

- Credit card accounts are added later in the account setup step. This category is only for budgeting payments.

### How do you get around?

Options:

- Car
- Motorcycle
- Bike
- Walk
- Public transit
- Gojek/Grab
- None of these apply to me

Rules:

| Option | Categories to Create |
| --- | --- |
| Car | Needs: Fuel; Needs: Parking and Tolls; Needs: Car Maintenance; Needs: Vehicle Registration; Needs: Vehicle Insurance |
| Motorcycle | Needs: Fuel; Needs: Parking and Tolls; Needs: Motorcycle Maintenance; Needs: Vehicle Registration; Needs: Vehicle Insurance |
| Bike | Needs: Bike Maintenance |
| Walk | No extra categories. |
| Public transit | Needs: Public Transit |
| Gojek/Grab | Needs: Gojek/Grab |
| None of these apply to me | No transportation categories. |

Notes:

- "Fuel" is shared by Car and Motorcycle.
- If both Car and Motorcycle are selected, create both maintenance categories but only one Fuel category.

### Which of these do you regularly spend money on?

Options:

- Groceries
- Phone
- Internet
- TV/Cable
- Personal care
- Clothing
- None of these apply to me

Rules:

| Option | Categories to Create |
| --- | --- |
| Groceries | Needs: Groceries |
| Phone | Needs: Phone |
| Internet | Needs: Internet |
| TV/Cable | Needs: TV/Cable |
| Personal care | Needs: Personal Care |
| Clothing | Wants: Clothing |
| None of these apply to me | No extra categories. |

Notes:

- These are common categories, but they should only be created if the user selects them.

### Which of these domestic services do you use?

Options:

- Pekerja Rumah Tangga
- Laundry
- Cleaning Service
- Driver
- Gardener
- None of these apply to me

Rules:

| Option | Categories to Create |
| --- | --- |
| Pekerja Rumah Tangga | Needs: Pekerja Rumah Tangga |
| Laundry | Needs: Laundry |
| Cleaning Service | Needs: Cleaning Service |
| Driver | Needs: Driver |
| Gardener | Needs: Gardener |
| None of these apply to me | No domestic service categories. |

Notes:

- Domestic services belong in Needs because they are household operations, not casual wants.

### Which of these subscriptions do you have?

Options:

- Music
- TV streaming
- Fitness
- Other subscriptions
- I do not subscribe to any of these

Rules:

| Option | Categories to Create |
| --- | --- |
| Music | Subscriptions: Music |
| TV streaming | Subscriptions: TV Streaming |
| Fitness | Subscriptions: Fitness |
| Other subscriptions | Subscriptions: Other Subscriptions |
| I do not subscribe to any of these | No subscription categories. |

Notes:

- Keep subscriptions separate from Wants because subscriptions are recurring and easy to forget.

### What less frequent expenses do you need to prepare for?

Options:

- Annual credit card fees
- Medical expenses
- Taxes or other fees
- None of these apply to me

Rules:

| Option | Categories to Create |
| --- | --- |
| Annual credit card fees | Needs: Annual Card Fees |
| Medical expenses | Needs: Medical Expenses |
| Taxes or other fees | Needs: Taxes and Fees |
| None of these apply to me | No extra categories. |

Notes:

- "Annual Card Fees" belongs in Needs rather than Debt because it is a fee, not repayment of borrowed money.

### What goals do you want to prioritize?

Options:

- Dream vacation
- New car
- New home
- Wedding
- New baby
- Emergency fund
- Retirement or investments
- I do not save for any of these

Rules:

| Option | Categories to Create |
| --- | --- |
| Dream vacation | Savings Goals: Vacation |
| New car | Savings Goals: New Car |
| New home | Savings Goals: New Home |
| Wedding | Savings Goals: Wedding |
| New baby | Savings Goals: Baby Fund |
| Emergency fund | Savings Goals: Emergency Fund |
| Retirement or investments | Savings Goals: Retirement and Investments |
| I do not save for any of these | No extra savings categories. |

Notes:

- Emergency Fund should only be created if the user selects it.

### What else do you want to include in your plan?

Options:

- Dining out
- Entertainment
- Hobbies
- Charity
- Holidays and gifts
- Decor and garden

Rules:

| Option | Categories to Create |
| --- | --- |
| Dining out | Wants: Dining Out |
| Entertainment | Wants: Entertainment |
| Hobbies | Wants: Hobbies |
| Charity | Wants: Giving |
| Holidays and gifts | Wants: Holidays and Gifts |
| Decor and garden | Wants: Decor and Garden |

Notes:

- Dining Out should only be created if the user selects it.

## Review Screen

After the survey, show a generated category plan grouped by default group:

- Needs
- Wants
- Subscriptions
- Debt
- Savings Goals

For each generated category, let the user:

- Keep it
- Remove it
- Rename it
- Move it to another group

Also include:

- Add category
- Add group only if future versions allow custom groups
- Continue to target setup

## Open Questions

- Should the survey support Indonesian-specific defaults later, such as THR, BPJS, zakat, mudik, school fees, or annual vehicle tax?
