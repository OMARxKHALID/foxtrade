---
description: OCR delegation-mode code review for foxtrade — OCR selects files and rules, Claude performs the review.
argument-hint: "[--commit <sha> | --from <ref> --to <ref>]"
---

Run Open Code Review (OCR) in delegation mode on foxtrade. OCR decides which files to review and supplies the rules. You do the actual review.

Arguments: $ARGUMENTS

## Step 1: Preview

```bash
ocr delegate preview -B .opencodereview/background.md $ARGUMENTS
```

- No arguments: workspace mode (staged, unstaged and untracked changes).
- Pass `--commit <sha>`, or `--from <ref> --to <ref>`, through unchanged.
- If `ocr` is missing, install it with `bun add -g @alibaba-group/open-code-review`. Never use npm.
- If there are no reviewable files, say so and stop.

## Step 2: Rules

Pass every reviewable path to OCR:

```bash
ocr delegate rule <path1> <path2> ...
```

Project rules in `.opencodereview/rule.json` apply automatically. Read `.opencodereview/design-notes.md` before reviewing. It covers the money model, trust boundaries and intentional design decisions that must not be reported.

## Step 3: Diffs and review

Get each file's diff for the mode from Step 1:
- Range: `git diff <merge_base>..<to> -- <path>`
- Commit: `git show <commit> -- <path>`
- Workspace: `git diff HEAD -- <path>`. Read untracked files directly.

Review changed lines only. Focus on correctness, security, money and ledger integrity, concurrency, error handling, performance and maintainability. Before reporting a finding, open the surrounding code, its callers and the related tests to confirm it. Drop anything the design notes mark as intentional.

## Step 4: Report

Classify each finding:
- **High:** a real bug, security hole, money or data integrity issue, or authorization gap, with a concrete failure scenario.
- **Medium:** a reasonable concern, a performance problem, or a project-rule violation, with a clear fix.
- **Low:** discard silently.

Report findings grouped by severity. Each finding gets a `file:line` link, the failure scenario and a proposed fix. Also list what you checked and found correct.

**Do not edit any files.** The user's rules say to stop after the review and let them decide what to fix. Never suggest adding code comments.
