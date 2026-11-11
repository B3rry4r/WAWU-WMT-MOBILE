# APP-RESET · round history

Moved out of [tasks/APP-RESET.md](../APP-RESET.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/api/identity.ts`, `src/app/{forgot-password,activate,reset-password}.tsx`, `src/features/auth/{ForgotPasswordScreen,ResetPasswordScreen,ResetByCodeFlow,LinkPasswordRoute,resetPassword}`, tests `src/__tests__/appResetRoutes.test.tsx` (real router, android and ios), `appResetWeb.test.tsx` (web), `appLinkRoutes.test.tsx` and `route-guard.test.tsx` (the two LINKS-01 activate cases and one PUBLIC reason rewritten: they pinned the old redirect this task replaces; no other assertion touched).
Capability checks: all four proved in jest (token, email, code and passwords sent exactly; refusals; offline) and on the web export with faked WAWU ID (pictures).

## Verifier report
