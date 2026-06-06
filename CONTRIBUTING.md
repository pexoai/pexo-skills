# Contributing to pexo-skills

## Adding or changing a skill

Each skill lives in `skills/<slug>/` and must contain:

- `SKILL.md` — YAML frontmatter (`name`, `description`) + instructions
- `README.md`
- supporting files (`references/`, `scripts/`, `tools/`) as needed

### Quality bar (enforced by CI — `.github/workflows/quality-check.yml`)

Every changed skill is scored; PRs below **60/100** fail. Each skill needs:

- a `name` field
- a `description` ≥ 20 chars
- a **"Use when"** / "When to use" section
- examples
- a `README.md`
- no hardcoded secrets

### Slug & naming convention

- The `name` field **must equal the directory name** (dir `image-to-video` → `name: image-to-video`).
- The repo (`pexoai/pexo-skills`) already carries the brand — **do not put "pexo" in the slug.**
  Use the user's actual search term as the slug: `image-to-video`, `text-to-video`,
  `tiktok-video-ad`, `product-photo-to-video`.
- Write the `description` as an agent router, not a keyword list:
  *what it does* → `Use when:` (natural phrases users actually say) → `NOT for:` (when to use a
  sibling skill instead).

### Versioning & release

Repo-wide version lives in `/VERSION`. Bump it on release. Pushing a `vX.Y.Z` tag triggers
`.github/workflows/publish.yml` (validates frontmatter, publishes to ClawHub, creates a GitHub
release).

## PR checklist

- [ ] `name` field equals the directory name
- [ ] `description` has a `Use when:` section and a `NOT for:` line
- [ ] `README.md` present
- [ ] no hardcoded secrets
- [ ] `bash scripts/update-check.sh` still runs without error
