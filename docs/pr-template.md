# Recommended PR template

MergeProof currently evaluates PR evidence from the PR title and body only. The recommended body format is:

```md
## What changed

## Why

## Proof

## Risk

## AI assistance
```

## Accepted section aliases

MergeProof matches headings with or without `##` and ignores letter case.

- What changed / Summary / Change summary
- Why / Motivation / Reason
- Proof / Testing / Tests / Evidence
- Risk / Risks / Blast radius
- AI assistance / AI disclosure / AI use

## Meaningful content

A section counts only when it has at least 15 non-whitespace characters.

Weak placeholders do not count:

- `N/A`
- `none`
- `todo`
- `-`
- `not sure`

## Scoring

- 4 or 5 valid sections => success
- 2 or 3 valid sections => neutral
- 0 or 1 valid sections => failure

This scoring is deterministic. It does not use AI.

## Good example

```md
## What changed
Added deterministic evidence evaluation for MergeProof check runs.

## Why
Maintainers need a quick signal that a PR has enough review context.

## Proof
Ran npm run build and verified webhook processing worked correctly.

## Risk
Low risk because this only changes check output behavior.

## AI assistance
AI was used only to help draft implementation structure.
```
