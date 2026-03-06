# Atomic Element Mapping Knowledge Base

This document provides the core logic for the Seedance Prompt Designer skill. It contains two critical mapping tables.

## Table 1: Asset Type -> Potential Atomic Elements

This table maps the type of user-uploaded asset to the most likely atomic element roles it can play in video generation. The skill should use this table in **Phase 1** to analyze uploaded assets.

| Asset Type (Heuristic) | Potential Atomic Element(s) |
| :--- | :--- |
| Image with a clear human/character face | Subject Identity, Aesthetic Style |
| Image of an object/product | Subject Identity (Object) |
| Image of a landscape/environment | Scene Environment, Aesthetic Style |
| Image with strong artistic style (e.g., painting, sketch) | Aesthetic Style |
| Image with clear compositional structure | Composition / Layout |
| Video with a character performing an action | Subject Motion, Subject Identity |
| Video with significant camera movement | Camera Language |
| Video with prominent visual effects | Visual Effects |
| Audio file with speech | Voice (Timbre) |
| Audio file with music | Non-speech (Music) |
| Audio file with sound effects | Non-speech (Sound Effect) |

## Table 2: Atomic Element -> Optimal Reference Method

This table defines the best way to reference each atomic element when constructing the prompt. The skill must use this table in **Phase 2** to design the reference strategy.

| Atomic Element | Optimal Method | Rationale |
| :--- | :--- | :--- |
| **Subject Identity** | **Asset** | High information density. Must use a reference image. |
| **Scene Environment** | **Hybrid** | Use an asset for the base, and text to modify details (e.g., weather). |
| **Aesthetic Style** | **Hybrid** | Use an asset to define the style, and text to specify its application. |
| **Composition / Layout** | **Asset** | Purely visual. Must be controlled by a keyframe image. |
| **Subject Motion** | **Hybrid** | Simple, describable actions use text. Complex, unique motions require a reference video. |
| **Camera Language** | **Text** | Standardized cinematic language. Text is clearer and more direct. |
| **Visual Effects** | **Text** | Most effects are describable. Only very unique effects need a reference video. |
| **Voice (Timbre)** | **Asset** | Unique biometric signature. Must use an audio sample. |
| **Voice (Performance)** | **Text** | Performance details (speed, tone, emotion) are best controlled by text/SSML. |
| **Non-speech (SFX / Music)** | **Asset** | Unique sounds/melodies must be provided as an asset. |
| **Multi-shot** | **Text** | Structural information is best defined by structured text (e.g., `multi_prompt`). |
| **Pacing** | **Text** | Temporal control is best defined by text parameters. |
| **Story Logic** | **Text** | Abstract concepts can only be guided by text prompts. |
