#!/bin/bash
# release.sh - One-click release to all channels
# Usage: bash scripts/release.sh 2.1.0 "Add new feature X"

set -e

VERSION=$1
CHANGELOG=$2

if [ -z "$VERSION" ]; then
  echo "❌ Usage: bash scripts/release.sh <version> [changelog]"
  echo "   Example: bash scripts/release.sh 2.1.0 'Add Stable Diffusion support'"
  exit 1
fi

if [ -z "$CHANGELOG" ]; then
  CHANGELOG="Release v$VERSION"
fi

echo "🚀 Releasing v$VERSION..."
echo "📝 Changelog: $CHANGELOG"
echo ""

# 1. Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory is not clean. Please commit or stash changes first."
  exit 1
fi

# 2. Create git tag
echo "🏷️  Creating git tag v$VERSION..."
git tag -a "v$VERSION" -m "$CHANGELOG"

# 3. Push tag (triggers GitHub Actions auto-publish)
echo "📤 Pushing tag to GitHub (this triggers automated publishing)..."
git push origin "v$VERSION"

echo ""
echo "✅ Tag v$VERSION pushed!"
echo ""
echo "📊 GitHub Actions will now automatically:"
echo "   1. Validate all SKILL.md files"
echo "   2. Publish to ClaWHub"
echo "   3. Trigger skills.sh install count"
echo "   4. Create GitHub Release"
echo ""
echo "🔗 Monitor progress at:"
echo "   https://github.com/pexoai/pexo-skills/actions"
echo ""
echo "📦 After ~5 minutes, verify publishing at:"
echo "   ClaWHub:  https://clawhub.ai/pexoai"
echo "   SkillsMP: https://skillsmp.com/search?q=pexoai"
