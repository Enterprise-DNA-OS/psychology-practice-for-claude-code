---
description: Reserve one visit with funding and clash checks
---

# Reserve one visit with funding and clash checks

Read CLAUDE.md first. Resolve names before changes; list ambiguous candidates and ask the operator. Use dates and values supplied for this task, never the illustrative values below.

```bash
node scripts/practice.mjs book --client="CLIENT" --practitioner="PRACTITIONER" --referral="REFERRAL" --at=2026-10-01T10:00:00+10:00 --fee-cents=22000 --currency=AUD
```

Read the result, then state the decision or outstanding field in plain words. Add `--json` for structured reads. For clinical notes use only the clinician's supplied words. Drafts stay in `drafts/`; do not send. Read `docs/compliance.md` for funding and privacy limits.
