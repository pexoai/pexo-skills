# Troubleshooting

Read `API.md` for the protocol and command reference.

- A successful chat receipt means accepted, not finished. Poll status every 60 seconds.
- HTTP failures are printed to stderr with `httpCode`, `message` and available backend details.
- `401 INVALID_API_KEY`: check the key belongs to the selected environment and has not been revoked.
- `401` with “API key authentication is not allowed for this endpoint”: the server's route policy
  does not allow this operation. This does not mean the key is invalid. Report the endpoint;
  do not silently switch to a browser session or rotate keys.
- `Invalid Agent request` or missing native receipt/items: client and server protocols differ.
  This branch targets test2. Do not repeatedly retry against the legacy production API.
- A timeout or lost acknowledgment does not prove a message was rejected. Reuse the printed
  request ID and identical content if retrying admission; never create a new ID automatically.
- `FAILED`: inspect `error` and `execution.status`. `recovery_required` is not an instruction
  to submit “continue” or regenerate. Report the failure and project link.
- `CONFIRM`: ask permission for the exact current quote. Insufficient credits require a top-up
  and a fresh quote read; an expired or changed quote requires fresh consent.
- Quote decision timeout: read status first. The server may already have accepted the decision.
- Asset `403`: access is denied or the signed URL expired. Fetch fresh metadata; do not claim
  a download succeeded. `412`: the requested derivative is still processing; retry the read later.
- Upload failures: check the selected file, extension and actual MIME type. Read the HTTP error
  to distinguish upload credential, file transfer and finalization failures.
- Config values are parsed as data, not shell code. Use `pexo-doctor.sh` for dependencies and auth.
- Unsupported origin: only `https://pexo.ai` and `https://test2.pexo.ai` are accepted.

Do not classify every failure as a credit problem. Preserve the backend error and apply its
remediation. Purchase credits through the selected environment's `/home?billing=credits` page.
