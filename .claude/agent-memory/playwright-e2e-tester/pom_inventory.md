---
name: pom_inventory
description: All Page Object Models created — file paths and responsibilities
metadata:
  type: project
---

## POMs

| File | Covers |
|------|--------|
| `e2e/pages/LoginPage.ts` | `/login` — `goto()`, `login()`, `fillEmail()`, `fillPassword()`, `submit()`, `expectOnLoginPage()`, `expectServerError()`, `expectFieldError()` |
| `e2e/pages/NavBarPage.ts` | Top navigation bar — `expectVisible()`, `expectUserName()`, `expectUsersLinkVisible()`, `expectUsersLinkHidden()` |
| `e2e/pages/TicketsPage.ts` | `/tickets` page + CreateTicketDialog — `goto()`, `openDialog()`, `closeDialogViaCancel()`, `fillSubject/FromName/FromEmail/Message()`, `selectCategory()`, `submitDialog()`, `createTicket()`, `expectOnTicketsPage()`, `expectEmptyState()`, `expectTableVisible()`, `expectDialogOpen/Closed()`, `expectFieldError()`, `expectServerError()`, `getRowBySubject()`, `getDataRows()` |
| `e2e/pages/UsersPage.ts` | `/users` page + Create/Edit/Delete dialogs — `goto()`, `expectOnUsersPage()`, `expectTableVisible()`, `getRowByText()`, `expectRowVisible()`, `expectRowNotVisible()`, `getStatusChipInRow()`, `openCreateDialog()`, `createUser()`, `clickEditForUser()`, `editUser()`, `clickDeleteForUser()`, `deleteUser()`, `cancelDeleteUser()`, `expectDialogOpen/Closed()`, `expectDialogContainsText()` |

## Specs that do NOT use POMs

`e2e/webhooks/inbound-email.spec.ts` — pure API calls via `request` fixture, no browser needed.

## Convention

- POMs live in `e2e/pages/`
- One class per page/major component
- Methods are named as actions (`goto`, `login`) or assertions (`expectVisible`, `expectServerError`)
- Selectors are encapsulated inside the POM class — tests never reference raw locators
