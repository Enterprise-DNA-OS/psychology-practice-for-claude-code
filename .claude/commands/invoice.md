---
description: Record a bill
---

# Record a bill

Read CLAUDE.md first. Resolve names before changes; list ambiguous candidates and ask the operator. Use dates and values supplied for this task, never the illustrative values below.

```bash
node scripts/practice.mjs invoice --name=INV-NEW --client="CLIENT" --payer="PAYER" --cents=22000 --currency=AUD --due=2026-10-01
```

Read the result, then state the decision or outstanding field in plain words. Add `--json` for structured reads. For clinical notes use only the clinician's supplied words. Drafts stay in `drafts/`; do not send. Read `docs/compliance.md` for funding and privacy limits.
