#!/usr/bin/env python3
"""Bundle the canonical API client into independently installable Pexo skills."""
import argparse
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'skills/pexo-agent'
TARGETS = (
    'ai-video-generation', 'explainer-video', 'founder-video', 'image-to-video',
    'launch-video', 'make-a-video', 'product-video', 'saas-video', 'startup-video',
    'text-to-video', 'tiktok-video-ad', 'video-ad', 'youtube-short-maker',
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if bundled files differ')
    args = parser.parse_args()
    files = sorted((SOURCE / 'scripts').glob('*')) + [
        SOURCE / 'references/API.md', SOURCE / 'references/TROUBLESHOOTING.md']
    stale = []
    for name in TARGETS:
        for source in files:
            target = ROOT / 'skills' / name / source.relative_to(SOURCE)
            if target.exists() and target.read_bytes() == source.read_bytes():
                continue
            if args.check:
                stale.append(str(target.relative_to(ROOT)))
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
    if stale:
        parser.exit(1, 'Run python3 scripts/sync-agent-client.py:\n' + '\n'.join(stale) + '\n')


if __name__ == '__main__':
    main()
