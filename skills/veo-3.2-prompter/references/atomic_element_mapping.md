# Atomic Element Mapping Knowledge Base

This document provides the core logic for the Veo 3.2 Prompt Designer skill. It contains two critical mapping tables, adapted for the Veo 3.2 Gemini API reference image system.

## Table 1: Asset Type → Potential Atomic Elements

This table maps the type of user-uploaded asset to the most likely atomic element roles it can play in video generation. The skill should use this table in **Phase 1** to analyze uploaded assets.

| Asset Type (Heuristic) | Potential Atomic Element(s) |
| :--- | :--- |
| Image with a clear human/character face | Subject Identity (Face), Aesthetic Style |
| Image of an object/product | Subject Identity (Object) |
| Image of a landscape/environment | Scene Environment, Aesthetic Style |
| Image with strong artistic style (e.g., painting, sketch, mood board) | Aesthetic Style |
| Image with clear compositional structure | Composition / Layout (use as first frame) |
| Video clip (user wants to extend it) | Video Extension source |
| Audio file with speech/dialogue | Audio Direction (describe in prompt) |
| Audio file with music | Audio Direction (describe in prompt) |
| Audio file with sound effects | Audio Direction (describe in prompt) |

**Note on Veo 3.2 vs Seedance**: Veo 3.2 does not use the `@asset_name` syntax. Instead, assets are attached via the `RawReferenceImage` API with explicit `reference_type`. Audio cannot be directly uploaded as a reference — audio direction is controlled via the text prompt with `generate_audio=True`.

## Table 2: Atomic Element → Optimal Reference Method

This table defines the best way to reference each atomic element when constructing the prompt for Veo 3.2. The skill must use this table in **Phase 2** to design the reference strategy.

| Atomic Element | Optimal Method | Veo 3.2 Implementation | Rationale |
| :--- | :--- | :--- | :--- |
| **Subject Identity (Face)** | **Asset** | `RawReferenceImage` with `reference_type="SUBJECT_FACE"` | Facial identity is biometric — must use a reference image. |
| **Subject Identity (Object)** | **Asset** | `RawReferenceImage` with `reference_type="SUBJECT"` | Object appearance requires visual reference for fidelity. |
| **Scene Environment** | **Hybrid** | `RawReferenceImage` with `reference_type="STYLE"` + text description | Use an asset for the base atmosphere, text to modify details (weather, time of day). |
| **Aesthetic Style** | **Hybrid** | `RawReferenceImage` with `reference_type="STYLE"` + text description | Use an asset to define the style, text to specify its application and nuances. |
| **Composition / Layout** | **Asset** | Use as `image` parameter (first frame) | Purely visual composition control — set as the start keyframe. |
| **Camera Language** | **Text** | Describe in prompt text | Standardized cinematic language. Text is clearer and more direct than any reference. |
| **Physical Interactions** | **Text** | Describe in prompt text | Artemis engine simulates physics from text descriptions (splashing, shattering, flowing). |
| **Audio / Dialogue** | **Text** | Describe in prompt text + `generate_audio=True` | Veo 3.2 generates synchronized audio from text descriptions. No audio upload supported. |
| **Multi-shot / Pacing** | **Text** | Describe sequence beats in prompt | Temporal control is best defined by text. For shots >30s, use video extension chaining. |
| **Story Logic** | **Text** | Describe in prompt text | Abstract narrative concepts can only be guided by text prompts. |
| **Video Continuation** | **Asset** | Use as `video` parameter (video extension) | Extend from a previous clip to maintain temporal coherence. |

## Reference Slot Budget

Veo 3.2 allows **up to 3 reference images** per generation call. The skill should allocate these slots strategically:

| Priority | Slot Allocation Strategy |
| :--- | :--- |
| **Character-driven scene** | 1× `SUBJECT_FACE` + 1× `STYLE` + (optional 1× `SUBJECT` for wardrobe/prop) |
| **Product showcase** | 1× `SUBJECT` (product) + 1× `STYLE` (brand aesthetic) |
| **Style transfer** | 1× `STYLE` (primary) + (optional additional `STYLE` for blending) |
| **Environment-focused** | 1× `STYLE` (environment reference) + text description for details |
| **Simple text-to-video** | No reference images — rely entirely on prompt text |

When the user provides more assets than available slots, prioritize by information density: face identity > object identity > style > environment.
