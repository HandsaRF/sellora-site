# Next Steps

## Priority 1

- Connect Gmail-lab output to the Sellora store transaction model carefully
- Decide how real Gmail sale events become store purchase transactions
- Keep `processing` emails outside income/profit
- Keep `refund completed` reducing finance
- Keep `refund issue` as alert-only
- Add a clean import/review step between the Gmail lab and the store workspace

## Priority 2

- Expand the store workspace review flow around:
  - unmatched Gmail transactions
  - missing shipping cost
  - confidence review
  - import approval
- Improve empty/loading/offline states around the new workspace flow
- Add clearer transaction summaries in the Financial Overview and Sales Ledger

## Priority 3

- Keep growing the separate Gmail parser lab first
- Validate the parser against more real Etsy emails and more refund variants
- Improve refund linking for orders with more than one item
- Improve parser confidence rules and duplicate handling
- Keep main Sellora Gmail UI minimal until the lab parser is proven over more history

## Later Expansion

- Etsy CSV reconciliation
- EPROLO API integration if access is granted
- Etsy API integration if approval clears
- Bank payout reconciliation in ILS
- Cloud storage migration after the workspace flow is stable

## Explicitly Not Urgent Yet

- Authentication
- Team/multi-user support
- Final accounting-grade finance
- Advanced automation features
