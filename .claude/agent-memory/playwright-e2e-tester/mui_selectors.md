---
name: mui_selectors
description: Reliable MUI v9 selector strategies for Playwright tests in this project
metadata:
  type: project
---

## Priority order

1. `getByRole()` — preferred; MUI renders accessible ARIA roles
2. `getByLabel()` — MUI TextField renders a `<label>` so this works for inputs
3. `getByText()` — for visible text content
4. `getByTestId()` — add `data-testid` when no reliable role/label exists
5. CSS selectors — last resort only; never use MUI-generated classnames (they change)

## Known role mappings

| MUI Component | ARIA role | Selector example |
|---------------|-----------|-----------------|
| Button | `button` | `getByRole('button', { name: 'Save' })` |
| TextField | `textbox` (via label) | `getByLabel('Email')` |
| Dialog | `dialog` | `getByRole('dialog')` |
| Table | `table` | `getByRole('table')` |
| Switch | `switch` | `getByRole('switch')` (NOT `checkbox`) |
| Alert | `alert` | `getByRole('alert')` |
| Heading | `heading` | `getByRole('heading', { name: '...', level: N })` |

## Scoping queries

Use `within(dialog)` to scope locators to an open MUI Dialog:

```typescript
import { within } from '@playwright/test';
const dialog = page.getByRole('dialog');
await within(dialog).getByRole('button', { name: 'Confirm' }).click();
```

## MUI Select interaction pattern

MUI Select renders as a button-like element with an `InputLabel`. To interact:
1. `await page.getByLabel('Category').click()` — opens the listbox
2. `await page.getByRole('option', { name: 'General' }).click()` — selects the option

The listbox renders at the document root (portal), not inside the dialog, so scope the option
selector to `page` not `dialog`.

## MUI Chip

MUI Chip labels are accessible as plain text nodes. Use `getByText('OPEN')` scoped to a table
row: `row.getByText('OPEN')`. No special role needed.

## Table row filtering

To get the first row containing a subject:
```typescript
table.getByRole('row').filter({ hasText: subject })
```

To exclude the header row from a filter, use `filter({ hasNot: page.getByRole('columnheader') })`.

## data-testid attributes added to components

None added yet — all selectors in existing tests use role/label/text.
