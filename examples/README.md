# Examples

This folder contains sample data you can use to try TalentFlow CLI without
writing your own resumes/job descriptions first.

```bash
talentflow screen \
  --jd examples/sample-jobs/backend-engineer.txt \
  --resumes examples/sample-resumes/ \
  --no-ai
```

Drop `--no-ai` once you've configured an AI provider (see the main
[README](../README.md#configuration)) to see semantic scoring, AI interview
kits, and AI-drafted emails in action.

- `sample-jobs/backend-engineer.txt` — a senior Node.js backend role
- `sample-resumes/` — three resumes spanning a strong match, a partial match,
  and a weak match, so you can see how ranking behaves across the board
