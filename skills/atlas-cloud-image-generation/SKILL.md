---
name: atlas-cloud-image-generation
description: >
  Generate an image with the Atlas Cloud asynchronous media API. Use when: a user asks for Atlas Cloud image generation or a Seedream image. NOT for: video generation, image editing, or models whose live schema has not been checked.
---

# Atlas Cloud Image Generation

Generate a text-to-image result with Atlas Cloud and poll the asynchronous task
until it completes.

## Use when

- The user explicitly asks to generate an image with Atlas Cloud.
- The user wants a Seedream 5 Lite text-to-image result.
- An agent needs a dependency-free CLI that returns generated image URLs.

NOT for video generation, image editing, or switching to another model without
first checking that model's live Atlas Cloud schema.

## Setup

Set the API key in the environment. Never pass it as a command-line argument or
write it to a project file.

```bash
export ATLASCLOUD_API_KEY="your-api-key-here"
```

## Generate

```bash
node {baseDir}/scripts/generate-image.mjs \
  --prompt "A red paper lantern floating above a quiet lake" \
  --size "2048*2048" \
  --output-format png
```

The command writes JSON to stdout. Return the first URL in `outputs` to the
user, or preserve the full array when multiple outputs are present.

## Workflow

1. Confirm `ATLASCLOUD_API_KEY` is set.
2. Improve the user's prompt without changing the requested subject.
3. Run the CLI and wait for a completed task.
4. Return the generated URL from `outputs`.
5. If the task fails, report the CLI error instead of retrying with guessed
   parameters.

## Examples

**User:** Generate a square product photo of a ceramic mug with Atlas Cloud.

```bash
node {baseDir}/scripts/generate-image.mjs \
  --prompt "Studio product photo of a white ceramic mug, soft side light, clean gray background" \
  --size "2048*2048"
```

**User:** Make a wide cinematic landscape with Seedream.

```bash
node {baseDir}/scripts/generate-image.mjs \
  --prompt "Wide cinematic landscape, mountain observatory at sunrise, detailed clouds" \
  --size "2848*1600" \
  --output-format jpeg
```

## Model safety

The bundled CLI targets `bytedance/seedream-v5.0-lite`, using parameters and
endpoints verified from its live Atlas Cloud schema. Model IDs and schemas can
change. Fetch `https://api.atlascloud.ai/api/v1/models`, require
`display_console: true`, and inspect the model's `schema` URL before changing
the model or request fields.
