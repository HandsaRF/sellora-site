# Gmail Parser Lab Plan

## Purpose

This lab exists to keep the risky Gmail work separate from the main Sellora workspace until the parser is proven.

The main Sellora web app should not become the first place where Google OAuth, Gmail search, and Etsy email parsing are tested.

Instead:

- `Sellora main app` remains focused on listings, costs, dummy sales, and store workspace flows
- `Gmail Parser Lab` becomes the isolated test surface for:
  - Google Gmail OAuth later
  - Etsy transaction email filtering
  - raw email parsing
  - parser confidence review

## Current Direction

The lab started with a local-first parser workflow and now supports both local parsing and real Gmail connection.

1. paste a raw Etsy transaction email or upload a saved `.eml`
2. parse only the fields needed by the Gmail-first sales workflow
3. save parse runs locally
4. compare parser accuracy across email variants
5. connect Gmail through Google OAuth
6. search Etsy transaction emails in the real inbox
7. parse real Gmail messages into the same local lab history

The lab should remain separate even now that Google OAuth is working. It is still the proving ground before any Gmail behavior is trusted in the main Sellora workspace.

## Target Sender And Query

The official sender target is:

- `transaction@etsy.com`

The future Gmail API query should begin with:

- `from:transaction@etsy.com`

## Required Parsed Fields

The lab only needs to prove these fields for now:

- `store`
- `listing_title`
- `style`
- `transaction_id`
- `quantity`
- `subtotal`

This matches the current Gmail-first workspace plan.

## Event Rules

The parser currently distinguishes between:

- `sale`
- `processing`
- `refund_completed`
- `refund_failed`

Business meaning:

- `sale` = real income signal
- `processing` = pending approval, not income yet
- `refund_completed` = real refund and should affect finance
- `refund_failed` = refund issue/alert only, not a finance reduction yet

The current UI wording should favor:

- `Sale email`
- `Pending approval`
- `Refund completed`
- `Refund issue`

Color direction:

- sale = green
- pending approval = amber
- refund completed = red
- refund issue = orange

## Current UI Surface

The lab should have:

### 1. Parser Workbench

- upload `.eml`
- paste raw email
- parse action
- clear/reset action

### 2. Latest Parse Result

- event type
- confidence
- extracted core fields
- matched fields
- missing fields
- parser notes
- normalized preview

### 3. Parse History

- recent saved runs
- confidence snapshot
- extracted key fields

### 4. Google Connection Panel

- Google OAuth connect action
- Gmail connection state
- connected email
- last sync timestamp
- sync action
- disconnect action
- setup notice when env vars are missing

## Explicit Separation Rule

Do not treat the current store-level Gmail settings dialog in the main workspace as the final Gmail product direction.

That UI is temporary and secondary.

The real Gmail direction now starts in the lab.

## Next Implementation Steps

1. validate the lab against more real Etsy sale/refund edge cases
2. improve matching logic for multi-item and refund linking behavior
3. decide how Gmail lab output should map into Sellora purchase transactions
4. keep the main Sellora Gmail UI minimal until the parser stays trustworthy over more samples
5. only then move proven parsing behavior into Sellora store workspaces

## Google Setup Notes

The lab expects these env vars in `web/.env.local`:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

Recommended local redirect URI:

- `http://localhost:3005/api/gmail-lab/oauth/callback`

The OAuth app may stay in testing for local development, but the Gmail account used for testing must be added as a Google OAuth test user.
