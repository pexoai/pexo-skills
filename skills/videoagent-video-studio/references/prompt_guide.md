# Video Generation Prompt Guide

Best practices for writing prompts that produce high-quality AI video.

## Text-to-Video

### Structure

1. **Subject** — What is in the shot (person, object, scene).
2. **Action / motion** — What is moving and how (walking, camera zoom, wind in trees).
3. **Style & quality** — Look and feel (cinematic, 4K, soft lighting).

### Strong vs weak prompts

| Weak | Strong |
|------|--------|
| "A dog" | "A golden retriever running through a sunlit meadow, grass swaying, shallow depth of field" |
| "Someone drinking coffee" | "Close-up of hands holding a white cup, steam rising, morning light from the left, cozy café background" |
| "City at night" | "Tokyo street at night, neon signs, light rain on pavement, camera slowly tracking forward" |

### Useful phrases

- **Camera:** "slow zoom in", "static shot", "pan left to right", "dolly forward", "handheld".
- **Motion:** "gentle movement", "slow motion", "smooth transition", "subtle motion".
- **Quality:** "4K", "cinematic", "film grain", "professional", "high detail".

---

## Image-to-Video

### Focus on motion

The model animates the image. Describe **what should move** and **how**, not the whole scene again.

- "Gentle breeze moving the hair and leaves."
- "Camera slowly zooms into the subject."
- "Clouds drifting across the sky, water slightly rippling."
- "Character blinks and smiles slightly."

### Avoid

- Repeating the full scene description (the image already defines it).
- Conflicting motion (e.g. "zoom in" and "zoom out" in one prompt).
- Too many moving elements in one short clip.

### By content type

| Content | Example motion prompt |
|---------|------------------------|
| Portrait | "Subtle breathing, soft blink, slight head turn" |
| Landscape | "Clouds moving, water ripple, grass sway" |
| Product | "Soft rotation on stand, reflection shift" |
| Logo / graphic | "Clean fade-in, gentle scale or float" |

---

## Duration and aspect ratio

- **4–5 s**: Good default; stable quality.
- **6–10 s**: Use when the user asks for "longer" or a specific length; some backends may cap at 5–6 s.
- **16:9** — Landscape (default for cinematic / desktop).
- **9:16** — Vertical (stories, reels, mobile).
- **1:1** — Square (feed, thumbnails).

For per-model duration and resolution limits (e.g. Veo 4s/6s/8s, Grok 1–15s), see [models.md](models.md).
