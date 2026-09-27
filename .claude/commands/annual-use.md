---
description: Record independently checked outside-provider use
---

# Record independently checked outside-provider use

Read CLAUDE.md first. Resolve names before changes; list ambiguous candidates and ask the operator. Use dates and values supplied for this task, never the illustrative values below.

```bash
node scripts/practice.mjs annual-use "CLIENT" --year=2026 --external=0 --checked=2026-09-27
```

Read the result, then state the decision or outstanding field in plain words. Add `--json` for structured reads. For clinical notes use only the clinician's supplied words. Drafts stay in `drafts/`; do not send. Read `docs/compliance.md` for funding and privacy limits.
