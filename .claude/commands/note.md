---
description: Write a draft clinical note
---

# Write a draft clinical note

Read CLAUDE.md first. Resolve names before changes; list ambiguous candidates and ask the operator. Use dates and values supplied for this task, never the illustrative values below.

```bash
node scripts/practice.mjs note SESSION-ID --text="CLINICIAN WORDS" --author="CLINICIAN"
```

Read the result, then state the decision or outstanding field in plain words. Add `--json` for structured reads. For clinical notes use only the clinician's supplied words. Drafts stay in `drafts/`; do not send. Read `docs/compliance.md` for funding and privacy limits.
