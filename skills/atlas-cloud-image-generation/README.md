# Atlas Cloud Image Generation

A dependency-free agent skill for generating images with the Atlas Cloud
asynchronous media API. The included Node.js CLI submits a Seedream 5 Lite
text-to-image task, polls it to completion, and prints the output URLs as JSON.

## Requirements

- Node.js 18 or newer
- An Atlas Cloud API key in `ATLASCLOUD_API_KEY`

```bash
export ATLASCLOUD_API_KEY="your-api-key-here"
```

## Usage

```bash
node scripts/generate-image.mjs \
  --prompt "A minimal red cube on a white studio background" \
  --size "2048*2048" \
  --output-format jpeg
```

Successful output has this shape:

```json
{
  "id": "prediction-id",
  "status": "completed",
  "model": "bytedance/seedream-v5.0-lite",
  "outputs": ["https://example.invalid/generated-image.jpeg"]
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `--prompt` | required | Text description of the image |
| `--size` | `2048*2048` | Image size accepted by the current model schema |
| `--output-format` | `jpeg` | `jpeg` or `png` |
| `--poll-interval-ms` | `3000` | Delay between status requests |
| `--max-attempts` | `60` | Maximum number of status requests |

## Validation

Run the protocol tests without an API key or network access:

```bash
node --test tests/generate-image.test.mjs
```

Before changing the model or parameters, fetch the current model catalogue and
follow the selected model's live `schema` URL. Do not infer model IDs, request
fields, or allowed values.
