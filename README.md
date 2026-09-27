# Psychology Practice for Claude Code

Clients, referral courses, sessions, notes, outcomes and invoices in a database you own. Built by Enterprise DNA. Runs with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. [Quick start](#quick-start) | Your fields, rules, Zanda records and a web front end if you want one. [Discuss your version](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=zanda) | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/zanda) |

## What this does

A psychology and counselling practice has a weekly rhythm: prepare the diary, reconcile referral allowances, finish notes, return reports to referrers, review outcomes and follow up unpaid accounts. This repository puts those jobs behind one CLI and one command per job. The database is the product; an approved agent is the door.

It covers individual Better Access course administration in Australia and entered ACC, EAP and private approvals in New Zealand. It records money but never processes payments or submits claims. It records scores but never diagnoses or recommends treatment. Read [the rule book](docs/compliance.md) for sources and scope.

This is an ownership and customisation option, not a promise of large savings. Zanda's current Australian list pricing is on its [pricing page](https://zandahealth.com/au/pricing/). Its standard subscription is below the five-figure annual bills this rebuild lane usually targets. Hosting, an agent service and maintenance still cost money.

## Quick start

Node 20 or later on Windows, macOS or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/psychology-practice-for-claude-code.git
cd psychology-practice-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
```

Open the folder in your agent and ask for `/attention`. The fictional practice includes exhausted referral courses, a missing note, a draft note, an overdue GP report, a late outcome review, unpaid client and EAP invoices in separate currencies, a missed visit and a waiting client. The seed is idempotent. All demo dates move with the day it is first seeded.

For your own database set DATABASE_URL in a private .env file, then run `npm run migrate`. Without it, the adapter uses PGlite in .data/db. To use a clean embedded store, set DATA_DIR in .env to a new directory before migrating; do not seed real practice data. The local base has no user login or role isolation. Before using sensitive records, provision the controls in [docs/compliance.md](docs/compliance.md) and approve your agent provider's data handling.

## Commands

The complete syntax is in [CLAUDE.md](CLAUDE.md) and `.claude/commands`. Every read supports `--json`; names are case-insensitive, partial IDs work, and ambiguous matches list candidates and exit 1.

- `/attention`: The decisions needing attention.
- `/clients`: The client list.
- `/client`: One client and their history.
- `/diary`: The practice diary.
- `/day-sheet`: Today by practitioner.
- `/referrals-due`: Courses with little funding left.
- `/referrals`: All referral courses.
- `/reports-due`: GP reports after a course ends.
- `/notes-due`: Completed sessions needing notes.
- `/outcomes`: Latest recorded score and review date.
- `/annual-allowance`: Individual Better Access use by year.
- `/invoices`: Billed and received by currency.
- `/debtors`: Outstanding balances and age.
- `/waitlist`: Who is waiting and their preferences.
- `/no-shows`: Missed appointments by client.
- `/rebooking`: Completed clients without a next booking.
- `/takings`: Billed, received and owing by payer.
- `/referrers`: Referral sources and reports outstanding.
- `/team`: Practitioners and registration reviews.
- `/compliance`: Record checks with cited sources.
- `/add`: Add a client, practitioner, referral or waitlist request.
- `/book`: Reserve one visit with funding and clash checks.
- `/complete`: Record an attended visit.
- `/cancel`: Cancel and release reserved allowance.
- `/dna`: Record a missed visit.
- `/note`: Write a draft clinical note.
- `/finalise`: Lock a reviewed note.
- `/addendum`: Correct a finalised note without overwriting.
- `/outcome`: Record a measure without interpretation.
- `/invoice`: Record a bill.
- `/pay`: Record an existing receipt.
- `/log`: Append a conversation.
- `/consent`: Record verified consent and contact permission.
- `/annual-use`: Record independently checked outside-provider use.
- `/allocate`: Attach an imported session to confirmed funding.
- `/report-sent`: Record the date a human sent a GP report.
- `/close-referral`: Close an interrupted or completed course.
- `/security-review`: Record security review evidence.
- `/draft-reminder`: Draft a permitted appointment reminder.
- `/draft-gp-letter`: Draft a course report for the clinician.
- `/import`: Import Zanda CSVs with a preview.
- `/export`: Export all records and archive privately.
- `/archive`: Inventory preserved source rows.
- `/archive-search`: Read original imported fields.
- `/weekly-review`: four reads turned into a Monday decision list.
- `/customise`: add a field or change a practice rule with a migration.
- `/new-view`: add a branded read-only view of your records.

## Ten questions beyond a fixed dashboard

These questions are answered by the shipped commands today. This is not a claim that Zanda cannot be configured to produce equivalent reports.

1. Which referral courses have no room left once booked sessions are included? `referrals-due`.
2. Which completed sessions still lack a finalised note, and who owns them? `notes-due`.
3. Which completed or interrupted courses still need a GP report? `reports-due`.
4. How many individual funded visits remain after outside-provider use? `annual-allowance`.
5. Which overdue balances belong to a client and which to an EAP payer? `debtors`.
6. Which latest outcome records are past their review date? `outcomes`.
7. Which clients attended but have no next appointment booked? `rebooking`.
8. Which clients have missed sessions, and when was the last one? `no-shows`.
9. Which referrers have courses waiting for a written report? `referrers`.
10. How much was billed, received and remains owing for each payer and currency? `takings`.

## Your first hour: ten things to ask for

1. Show the attention list and who owns each decision.
2. Show the booked sessions already using Alex Morgan's remaining referral allowance.
3. List each completed visit that still needs its clinician's note.
4. Draft Jamie Patel's GP report, leaving clinical findings for the clinician.
5. Show late invoices separately in AUD and NZD.
6. Record the actual consent date and contact permission for Riley King.
7. Show the change in recorded goal rating without interpreting it.
8. Preview our Zanda export and report every unmapped field.
9. Change the security evidence review interval to our documented practice policy.
10. Add a read-only page showing overdue reports by referrer.

## Instead of Zanda or Power Diary

[The migration guide](docs/replace-zanda.md) gives the one-command import, optional diary and finance mappings, and cutover checks. Every CSV row is retained in a searchable source archive. Clients become operational records immediately. A reviewed mapping activates appointments, invoices and receipts. Old clinical notes stay in the source archive rather than being re-signed as new notes. Keep attachments in a restricted original export.

```bash
node scripts/practice.mjs import zanda --dir="export-folder" --country=AU --dry-run
node scripts/practice.mjs import zanda --dir="export-folder" --country=AU
```

## Documents and views

Edit brand.json once for your name, logo and colours. `npm run docs` creates account statements, clinician report drafts and session summaries as local HTML. `npm run view` renders attention, the coming week, referral courses and receivables. These files contain health information when real records are used. Keep them in restricted storage. [Why no front end](docs/why-no-front-end.md) explains mobile, offline, drag-and-drop and self-service limits.

## Architecture and validation

PostgreSQL 14+ or PGlite, one adapter, numbered transactional migrations, standard UUIDs, timestamps and update triggers. Clinical notes lock on finalisation; addenda, receipts and activity are append-only. CLI transactions lock clients and practitioners for booking, referrals for course capacity, annual usage for annual limits and invoices for payments. Database owners can bypass application permissions; provision restricted roles for production.

`npm test` migrates and seeds a fresh temporary database, exercises every CLI command, checks funding failures, ambiguous names, note immutability, invoice balances, CSV quoting, repeat imports, rollback, drafts and rendered HTML. It uses Node APIs and the current Node executable on Windows and Linux. Tests use synthetic export fixtures, not private vendor exports.

Built with Codex using Enterprise DNA's shared rebuild template. MIT licence. Copyright 2026 Enterprise DNA.
