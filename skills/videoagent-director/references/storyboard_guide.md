# Storyboard Guide — Prompt Patterns and Pacing

A reference for writing effective storyboard scripts. Covers shot types, pacing rules, and prompt language for each asset type.

---

## Shot Structure

Every shot in a storyboard has four elements:

| Element | What to Define |
|---------|---------------|
| **Visual frame** | Composition, subject, lighting, style |
| **Motion** | Camera movement, subject movement, atmosphere |
| **Duration** | How long the shot runs (4–10 s is typical) |
| **Audio** | Music, SFX, narration, or silence |

---

## Shot Types and When to Use Them

### Establishing Shot
- **Purpose:** Open a scene, provide context and scale
- **Camera:** Wide, high angle, or drone
- **Example:** `Aerial shot of a coastal town at sunset, warm orange glow, cinematic wide angle`
- **Duration:** 5–8 s

### Close-Up
- **Purpose:** Emotion, product detail, texture
- **Camera:** Tight framing, macro if needed
- **Example:** `Extreme close-up of coffee beans in a scoop, shallow depth of field, soft studio light`
- **Duration:** 3–5 s

### Medium Shot
- **Purpose:** Action, character interaction, storytelling
- **Camera:** Waist-up framing
- **Example:** `Medium shot of a barista at work, steam rising from espresso machine in background`
- **Duration:** 4–6 s

### Tracking Shot
- **Purpose:** Follow a subject, build momentum
- **Camera:** Smooth lateral or forward movement
- **Example:** `Camera tracks alongside a cyclist through a city street, motion blur on edges, golden hour`
- **Duration:** 5–8 s

### POV Shot
- **Purpose:** Immersive, first-person experience
- **Camera:** Handheld or slightly shaky
- **Example:** `POV looking down at hands holding a warm mug, cozy morning light, soft focus background`
- **Duration:** 3–5 s

### Cutaway
- **Purpose:** B-roll, context, transition
- **Camera:** Static or slow movement
- **Example:** `Slow zoom into a rain-streaked window, city lights blurred in background`
- **Duration:** 3–5 s

---

## Pacing Patterns

### Brand / Product Video (30 s)
```
Shot 1 (6 s) — Establishing: set the scene and mood
Shot 2 (5 s) — Close-up: product or key detail
Shot 3 (5 s) — Action: someone using the product
Shot 4 (5 s) — Close-up: sensory moment (steam, texture, taste)
Shot 5 (4 s) — Medium: person enjoying / benefitting
Shot 6 (5 s) — Logo / brand reveal
```

### Social Reel (15 s, vertical 9:16)
```
Shot 1 (3 s) — Hook: bold visual that grabs attention in 1 s
Shot 2 (4 s) — Core message: product / action
Shot 3 (4 s) — Payoff: reaction or result
Shot 4 (4 s) — CTA or outro
```

### Short Film Teaser (45 s)
```
Shot 1 (8 s) — Establishing: world and atmosphere
Shot 2 (6 s) — Character introduction
Shot 3 (5 s) — Inciting moment / conflict hint
Shot 4 (6 s) — Action or tension
Shot 5 (8 s) — Emotional peak
Shot 6 (6 s) — Unresolved cliffhanger
Shot 7 (6 s) — Title card or tagline
```

---

## Audio Strategy

### Music
Best for: sustained mood, emotional continuity across multiple shots.

| Mood | Prompt Example |
|------|---------------|
| Calm / morning | `gentle piano, warm acoustic guitar, lo-fi morning` |
| Energetic | `upbeat electronic, driving beat, 120 BPM` |
| Cinematic / epic | `orchestral swell, strings, rising tension` |
| Sad / reflective | `sparse piano, minor key, ambient fade` |
| Corporate | `clean corporate pop, positive, modern` |

**Use music for:** opening shot, ending shot, transitional shots without strong action.

### Sound Effects (SFX)
Best for: specific events within a shot.

| Situation | Prompt Example |
|-----------|---------------|
| Coffee / liquid | `espresso pouring, liquid stream, gentle splash` |
| Nature | `ocean waves, seagulls, light wind` |
| City | `traffic hum, distant chatter, rain on pavement` |
| Tech / UI | `keyboard typing, soft notification chime` |
| Food | `sizzling pan, knife on cutting board, ice in glass` |

**Use SFX for:** action shots, product shots, sensory moments.

### Narration / TTS
Best for: story-driven content, explainer videos, documentary style.

**Rules:**
- Keep each line under 20 words
- Match the line to the shot duration (5 s shot ≈ 10–15 words at normal pace)
- Write conversational, not formal

| Shot Duration | Max Words |
|---------------|-----------|
| 3–4 s | 8–10 words |
| 5–6 s | 12–15 words |
| 7–8 s | 18–22 words |

---

## Prompt Language Glossary

### Image prompts — composition terms
- `close-up`, `extreme close-up`, `medium shot`, `wide shot`, `aerial`, `overhead`
- `rule of thirds`, `centered composition`, `foreground / background`
- `shallow depth of field`, `bokeh background`, `sharp throughout`

### Image prompts — lighting
- `soft morning light`, `golden hour`, `blue hour`, `overcast diffused`
- `studio lighting`, `backlit silhouette`, `rim light`, `neon-lit`
- `candlelight`, `harsh midday sun`, `fog-filtered light`

### Image prompts — style modifiers
- `cinematic`, `editorial photography`, `film still`, `35mm grain`
- `product shot`, `commercial photography`, `lifestyle photography`
- `illustration`, `concept art`, `3D render`, `watercolor`

### Video prompts — camera movement
- `static shot` (no movement)
- `camera slowly pushes in / pulls back`
- `slow pan left / right`
- `smooth upward tilt`
- `tracking alongside the subject`
- `drone ascending slowly`
- `handheld, slight sway`

### Video prompts — subject motion
- `steam rises gently`, `fabric sways in breeze`, `water ripples`
- `person walks toward camera`, `hand reaches into frame`
- `eyes close slowly`, `slight smile forms`
- `liquid pours in slow motion`

---

## Style Consistency

To keep all shots visually cohesive, choose a **style lock** before generating and append it to every prompt.

### Example style locks

| Project Type | Style Lock |
|-------------|------------|
| Minimalist brand | `clean white space, soft studio light, editorial, product photography` |
| Cinematic short film | `cinematic, anamorphic lens, warm amber tones, shallow DOF, 35mm film` |
| Social lifestyle | `bright and airy, natural daylight, lifestyle photography, Canon 5D` |
| Corporate / tech | `clean modern office, cool blue tones, sharp focus, professional` |
| Dark / moody | `low key lighting, deep shadows, noir, desaturated except highlights` |

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Describing appearance in video prompt | Video prompt = motion only; appearance is in image prompt |
| Too many concepts in one shot | One idea per shot; split complex scenes |
| Audio not matching shot duration | A 5 s shot needs 5 s of audio; avoid long intros |
| Inconsistent style across shots | Always use a style lock string |
| Vague motion ("it moves") | Be specific: "camera slowly pushes in 20%", "subject turns left" |
