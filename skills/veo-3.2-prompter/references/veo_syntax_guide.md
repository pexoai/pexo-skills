# Veo 3.2 Syntax Guide

This document covers the essential syntax for interacting with the Veo 3.2 model via the Gemini API, focusing on the reference image system and generation configuration.

> **Note**: Model ID `veo-3.2-generate` is provisional. Update when Google officially announces the endpoint. Current stable model: `veo-3.1-generate-preview`.

## The Reference Image System

Veo 3.2 uses `RawReferenceImage` to attach up to 3 reference images to a generation request. Each reference image is assigned a `reference_type` that tells the model how to use it.

**Basic Syntax**:

```python
from google.genai import types

ref = types.RawReferenceImage(
    reference_image=types.Image.from_file("asset.jpg"),
    reference_type="SUBJECT",  # STYLE | SUBJECT | SUBJECT_FACE
)
```

### Reference Types

| Type | Purpose | When to Use |
|---|---|---|
| `STYLE` | Match visual style, color palette, mood, artistic direction | User provides a style reference, mood board, or "make it look like this" |
| `SUBJECT` | Maintain object/character appearance across generation | User provides a product photo, character reference, or object to feature |
| `SUBJECT_FACE` | Preserve facial identity with high fidelity | User provides a portrait or wants a specific person's face preserved |

### Common Usage Patterns

1. **Single Subject Reference**:
    ```python
    config = types.GenerateVideosConfig(
        reference_images=[
            types.RawReferenceImage(
                reference_image=types.Image.from_file("product.jpg"),
                reference_type="SUBJECT",
            )
        ],
    )
    ```

2. **Style + Subject (Hybrid)**:
    ```python
    config = types.GenerateVideosConfig(
        reference_images=[
            types.RawReferenceImage(
                reference_image=types.Image.from_file("style_ref.jpg"),
                reference_type="STYLE",
            ),
            types.RawReferenceImage(
                reference_image=types.Image.from_file("character.jpg"),
                reference_type="SUBJECT",
            ),
        ],
    )
    ```

3. **Face Preservation + Style**:
    ```python
    config = types.GenerateVideosConfig(
        reference_images=[
            types.RawReferenceImage(
                reference_image=types.Image.from_file("actor_face.jpg"),
                reference_type="SUBJECT_FACE",
            ),
            types.RawReferenceImage(
                reference_image=types.Image.from_file("noir_style.jpg"),
                reference_type="STYLE",
            ),
        ],
    )
    ```

### Best Practices

- **Be Explicit in Prompt**: Always describe how the reference should be used in the text prompt. E.g., "The woman from the reference image walks through the garden" rather than just uploading and hoping.
- **One Primary Role Per Image**: While an image can inform both style and subject, assign the most important role via `reference_type`.
- **High-Quality References**: Use clear, well-lit reference images. Low-resolution or ambiguous references degrade output quality.
- **Check for Conflicts**: Don't use two different `SUBJECT_FACE` references — the model cannot reconcile two different face identities.

---

## GenerateVideosConfig Parameters

```python
config = types.GenerateVideosConfig(
    aspect_ratio="16:9",
    number_of_videos=1,
    duration_seconds=8,
    resolution="1080p",
    generate_audio=True,
    person_generation="allow_adult",
    reference_images=[...],
)
```

| Parameter | Type | Default | Options |
|---|---|---|---|
| `aspect_ratio` | str | `"16:9"` | `"16:9"`, `"9:16"` |
| `number_of_videos` | int | `1` | 1–4 |
| `duration_seconds` | int | `8` | 4, 6, 8 (3.1) / up to 30 (3.2 expected) |
| `resolution` | str | `"720p"` | `"720p"`, `"1080p"`, `"4k"` |
| `generate_audio` | bool | `False` | `True` / `False` |
| `person_generation` | str | `"dont_allow"` | `"dont_allow"`, `"allow_adult"` |
| `reference_images` | list | `[]` | Up to 3 `RawReferenceImage` objects |

---

## Generation Modes

### 1. Text-to-Video

```python
operation = client.models.generate_videos(
    model="veo-3.2-generate",
    prompt="your prompt here",
    config=config,
)
```

### 2. Image-to-Video (First Frame)

Specify a start frame — the generated video will begin from this exact image.

```python
operation = client.models.generate_videos(
    model="veo-3.2-generate",
    prompt="the scene unfolds from this frame",
    image=types.Image.from_file("first_frame.jpg"),
    config=config,
)
```

### 3. Last Frame Specification

Generate video that ends at a specific target frame.

```python
operation = client.models.generate_videos(
    model="veo-3.2-generate",
    prompt="transition ending at this composition",
    config=types.GenerateVideosConfig(
        end_image=types.Image.from_file("last_frame.jpg"),
        aspect_ratio="16:9",
    ),
)
```

### 4. Video Extension

Extend a previously generated clip with a continuation prompt.

```python
previous_video = types.Video.from_file("clip_01.mp4")

operation = client.models.generate_videos(
    model="veo-3.2-generate",
    prompt="The camera pulls back to reveal the full cityscape at night",
    video=previous_video,
    config=config,
)
```

### 5. 4K Upscaling

```python
operation = client.models.upscale_video(
    model="veo-3.2-generate",
    video=types.Video.from_file("output_1080p.mp4"),
    config=types.UpscaleVideoConfig(resolution="4k"),
)
```

---

## Polling for Results

All generation calls return an `operation` object. Poll until `operation.done` is `True`.

```python
import time

while not operation.done:
    time.sleep(10)
    operation = client.operations.get(operation)

for video in operation.result.generated_videos:
    client.files.download(file=video.video)
    video.video.save("output.mp4")
```

---

## Error Handling

Common failure reasons:
- **Content policy violation**: NSFW, violence, or public figure depiction
- **Invalid parameter combination**: e.g., 4K + 9:16 may not be supported
- **Reference image quality**: too low resolution or ambiguous content
- **API quota exceeded**: check usage limits

```python
try:
    operation = client.models.generate_videos(...)
    # ... poll ...
    if operation.result and operation.result.generated_videos:
        for video in operation.result.generated_videos:
            video.video.save("output.mp4")
    else:
        print("No videos returned (possibly content-filtered)")
except Exception as e:
    print(f"Generation failed: {e}")
```
