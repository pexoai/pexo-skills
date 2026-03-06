#!/bin/bash
# setup-github-topics.sh
# Set up GitHub Topics for repository discoverability
# Usage: bash scripts/setup-github-topics.sh

set -e

REPO="pexoai/pexo-skills"

echo "🏷️  Setting GitHub Topics for $REPO..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/topics" \
  -f "names[]=claude-skills" \
  -f "names[]=agent-skills" \
  -f "names[]=skill-md" \
  -f "names[]=skillsmp" \
  -f "names[]=claude-code" \
  -f "names[]=claude-code-plugin" \
  -f "names[]=claude-code-skill" \
  -f "names[]=claude-code-skills" \
  -f "names[]=claude-code-marketplace" \
  -f "names[]=agentskills" \
  -f "names[]=image-studioeration" \
  -f "names[]=audio-generation" \
  -f "names[]=content-creation" \
  -f "names[]=openclaw"

echo "✅ Topics set successfully!"
echo ""
echo "Topics added:"
echo "  claude-skills, agent-skills, skill-md, skillsmp,"
echo "  claude-code, claude-code-plugin, claude-code-skill,"
echo "  claude-code-skills, claude-code-marketplace, agentskills,"
echo "  image-studioeration, audio-generation, content-creation, openclaw"
echo ""
echo "🔍 Your repo will now be discovered by:"
echo "  - SkillsMP (searches filename:SKILL.md + topics)"
echo "  - SkillHub (GitHub topic crawler)"
echo "  - LobeHub (awesome-list + topic crawler)"
echo "  - mcpservers.org (topic crawler)"
echo "  - skill0 (topic crawler)"
