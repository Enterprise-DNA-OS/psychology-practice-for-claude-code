# Psychology Practice for Claude Code

This is a practice administration workspace for psychologists and counsellors. Configure the business name in brand.json. Demo data is fictional. The clinician owns treatment, consent, clinical language and disclosure decisions.

## Rules

- Read before writing. Use the CLI below; do not invent records or silently resolve ambiguous names.
- Never send, claim, charge a card or publish a health record. Drafts stay local for a person to review.
- Keep finalised notes intact. Corrections use addendum. Do not generate clinical findings or interpret scores.
- Funding checks are administration, not eligibility or treatment decisions. Read docs/compliance.md.
- Before real records, verify the practice's host, access controls, encryption, backups, retention and agent data agreement. The demo has no application authentication.
- Never commit health records, exports, generated documents, credentials or drafts. Use synthetic fixtures for tests.
- Every timestamp needs its local offset. Every amount is integer cents with AUD or NZD, never mixed.
- Imported appointments start unallocated. Reconcile referrals and outside-provider annual usage before assigning funding.

## Routes

- `/attention`: `node scripts/practice.mjs attention`. The decisions needing attention.
- `/clients`: `node scripts/practice.mjs clients`. The client list.
- `/client`: `node scripts/practice.mjs client "CLIENT"`. One client and their history.
- `/diary`: `node scripts/practice.mjs diary`. The practice diary.
- `/day-sheet`: `node scripts/practice.mjs day-sheet`. Today by practitioner.
- `/referrals-due`: `node scripts/practice.mjs referrals-due`. Courses with little funding left.
- `/referrals`: `node scripts/practice.mjs referrals`. All referral courses.
- `/reports-due`: `node scripts/practice.mjs reports-due`. GP reports after a course ends.
- `/notes-due`: `node scripts/practice.mjs notes-due`. Completed sessions needing notes.
- `/outcomes`: `node scripts/practice.mjs outcomes`. Latest recorded score and review date.
- `/annual-allowance`: `node scripts/practice.mjs annual-allowance`. Individual Better Access use by year.
- `/invoices`: `node scripts/practice.mjs invoices`. Billed and received by currency.
- `/debtors`: `node scripts/practice.mjs debtors`. Outstanding balances and age.
- `/waitlist`: `node scripts/practice.mjs waitlist`. Who is waiting and their preferences.
- `/no-shows`: `node scripts/practice.mjs no-shows`. Missed appointments by client.
- `/rebooking`: `node scripts/practice.mjs rebooking`. Completed clients without a next booking.
- `/takings`: `node scripts/practice.mjs takings`. Billed, received and owing by payer.
- `/referrers`: `node scripts/practice.mjs referrers`. Referral sources and reports outstanding.
- `/team`: `node scripts/practice.mjs team`. Practitioners and registration reviews.
- `/compliance`: `node scripts/practice.mjs compliance`. Record checks with cited sources.
- `/add`: `node scripts/practice.mjs add client --name="NAME" --country=AU`. Add a client, practitioner, referral or waitlist request.
- `/book`: `node scripts/practice.mjs book --client="CLIENT" --practitioner="PRACTITIONER" --referral="REFERRAL" --at=2026-10-01T10:00:00+10:00 --fee-cents=22000 --currency=AUD`. Reserve one visit with funding and clash checks.
- `/complete`: `node scripts/practice.mjs complete SESSION-ID`. Record an attended visit.
- `/cancel`: `node scripts/practice.mjs cancel SESSION-ID`. Cancel and release reserved allowance.
- `/dna`: `node scripts/practice.mjs dna SESSION-ID`. Record a missed visit.
- `/note`: `node scripts/practice.mjs note SESSION-ID --text="CLINICIAN WORDS" --author="CLINICIAN"`. Write a draft clinical note.
- `/finalise`: `node scripts/practice.mjs finalise NOTE-ID`. Lock a reviewed note.
- `/addendum`: `node scripts/practice.mjs addendum NOTE-ID --text="CORRECTION" --author="CLINICIAN"`. Correct a finalised note without overwriting.
- `/outcome`: `node scripts/practice.mjs outcome "CLIENT" --instrument="MEASURE" --score=5 --date=2026-09-27 --review=2026-10-11`. Record a measure without interpretation.
- `/invoice`: `node scripts/practice.mjs invoice --name=INV-NEW --client="CLIENT" --payer="PAYER" --cents=22000 --currency=AUD --due=2026-10-01`. Record a bill.
- `/pay`: `node scripts/practice.mjs pay "INVOICE" --cents=22000 --reference="BANK REFERENCE" --date=2026-09-27`. Record an existing receipt.
- `/log`: `node scripts/practice.mjs log "CLIENT" --text="WHAT HAPPENED" --author="OPERATOR"`. Append a conversation.
- `/consent`: `node scripts/practice.mjs consent "CLIENT" --date=2026-09-27 --contact=true`. Record verified consent and contact permission.
- `/annual-use`: `node scripts/practice.mjs annual-use "CLIENT" --year=2026 --external=0 --checked=2026-09-27`. Record independently checked outside-provider use.
- `/allocate`: `node scripts/practice.mjs allocate SESSION-ID --referral="REFERRAL"`. Attach an imported session to confirmed funding.
- `/report-sent`: `node scripts/practice.mjs report-sent "REFERRAL" --date=2026-09-27`. Record the date a human sent a GP report.
- `/close-referral`: `node scripts/practice.mjs close-referral "REFERRAL"`. Close an interrupted or completed course.
- `/security-review`: `node scripts/practice.mjs security-review --name="backup restore" --date=2026-09-27 --evidence="REVIEW RECORD"`. Record security review evidence.
- `/draft-reminder`: `node scripts/practice.mjs draft-reminder SESSION-ID`. Draft a permitted appointment reminder.
- `/draft-gp-letter`: `node scripts/practice.mjs draft-gp-letter "REFERRAL"`. Draft a course report for the clinician.
- `/import`: `node scripts/practice.mjs import zanda --dir="EXPORT DIRECTORY" --country=AU --dry-run`. Import Zanda CSVs with a preview.
- `/export`: `node scripts/practice.mjs export --dir="PRIVATE DIRECTORY"`. Export all records and archive privately.
- `/archive`: `node scripts/practice.mjs archive`. Inventory preserved source rows.
- `/archive-search`: `node scripts/practice.mjs archive-search --text="CLIENT IDENTIFIER"`. Read original imported fields.
- `/weekly-review`: attention, referrals-due, debtors and outcomes; write a local draft.
- `/customise`: next numbered migration, update CLI, apply and test.
- `/new-view`: SELECT sections in views.json, then npm run view.

## Files

supabase/migrations holds plain SQL; scripts/lib/db.mjs selects DATABASE_URL or local PGlite. scripts/practice.mjs is the single CLI. documents.json and views.json use the shared brand.json renderer. .claude/commands contains the recurring jobs for every agent runtime. `npm test` uses a temporary database, never the practice database.

Built and operated through Omni by Enterprise DNA. https://enterprisedna.co/omni/instead-of/zanda
