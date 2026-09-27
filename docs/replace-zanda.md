# Bring your Zanda records across

[Zanda's export guide](https://zandahealth.com/support/account-management/exporting-your-data/), checked 27 September 2026, documents Tools > Data Export. An authorised user selects All data and the desired datasets, waits for the download, then extracts Data Export.zip. Export Uploaded Client Files separately. Keep both originals under the practice's retention and security policy.

## One command, preview first

Use a fresh migrated database for your practice. Do not import into the fictional demo.

```bash
node scripts/practice.mjs import zanda --dir="/secure/extracted-export" --country=AU --dry-run
node scripts/practice.mjs import zanda --dir="/secure/extracted-export" --country=AU
```

Every CSV row is retained verbatim as parsed field values in `import_rows`, including multiline note text. Source file and row fingerprint make repeated unchanged exports idempotent. Changed rows become additional archive versions. Clients.csv also becomes an operational client list using ClientID/Client Number/ID, name or first/last name, email and ISO date of birth. Consent and contact permission start unconfirmed. Existing clients are never overwritten by a re-import.

## Activate diary and money history

The vendor's public guide does not promise fixed headers for every export. Compare the actual headers with `docs/zanda-columns.example.json`, edit that mapping, create each practitioner with `add practitioner`, then run:

```bash
node scripts/practice.mjs import zanda --dir="/secure/extracted-export" --country=AU --map=docs/zanda-columns.example.json --dry-run
node scripts/practice.mjs import zanda --dir="/secure/extracted-export" --country=AU --map=docs/zanda-columns.example.json
```

The example is a synthetic mapping, not a verified vendor specimen. Map client ID, appointment ID, practitioner, status, timestamp and duration explicitly. Map each source status to booked, completed, cancelled or dna. Map fee amounts in integer cents and currencies explicitly; transform decimal amounts before importing rather than guessing. Invoice and payment mappings preserve source IDs and reconcile receipts. Unsupported group or personal appointment types must be filtered into their own retained archive or mapped by an operator before activation.

ISO timestamps must have an offset. `--utc-offset=+10:00` accepts local ISO times for an export with that single verified offset. For a period spanning daylight-saving changes, transform every timestamp to its correct offset first. Dates must be YYYY-MM-DD. Unknown references, missing fields, overlapping appointments and overpayments roll back the entire import, including the archive. Nothing is silently skipped.

Imported appointments start unfunded. Reconstruct each open referral from its signed authority, enter previously used sessions and independently checked annual usage, and assign the imported visits with `allocate`. Do not count the same historical sessions both as prior use and as locally allocated visits. Session notes, forms, diagnosis records, communications and other CSVs remain searchable archival records; they are not re-signed or converted into new clinical notes. Attachments remain in the separately secured original files. Portals, claiming credentials, payment tokens and reminders are not transferred.

## Reconcile before switching

1. Match client counts and a sample of names against the source.
2. Match the next two weeks of appointments, their local time and practitioner.
3. Match invoice totals and receipts separately in each currency.
4. Rebuild open referral allowances, consent and annual outside-provider usage.
5. Open the exported clinical notes and attachments for a sample of clients.
6. Run both systems during the check, then have the practice owner approve the cutover.

`archive-search --text="client identifier"` searches imported fields. `export --dir=/secure/backup` writes every operational entity and the complete raw archive as JSON in one repeatable-read snapshot. Store it privately. An importer tested against synthetic fixtures still needs a dry run and reconciliation against your actual export.
