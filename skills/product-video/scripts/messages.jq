# Public conversation only. Tool internals are not user-visible attachments.
def assets:
  [.content[]? | select(.type == "resource_link") | .uri |
   capture("^asset://(?<id>[^/?#[:space:]]+)$") | .id] | reduce .[] as $id ([]; if index($id) then . else . + [$id] end);
[.[] |
  if .kind == "message" and .status == "completed" and .payload.message.purpose != "media_confirmation" then
    (.payload.role | ascii_upcase) as $role |
    ([.payload.message.content[] | select(.type == "text") | .text] | join("\n")) as $text |
    ([.payload.message.content[] | select(.type == "asset") | .assetId]) as $assets |
    (if $text != "" then {role: $role, event: "message", text: $text} else empty end),
    (if $assets | length > 0 then {role: $role, event: "attachment", assetIds: $assets} else empty end)
  elif .kind == "tool" and .status == "completed" and .payload.result.isError != true then
    .payload as $tool | $tool.result.structuredContent as $data |
    if $data.type == "attachments" then
      ($tool.result | assets) as $assets |
      select($assets | length > 0) |
      {role: "ASSISTANT", event: (if $data.mode == "select" then "choices" else "attachment" end), assetIds: $assets}
    elif $tool.call.name == "publish_file" and $data.mediaType == "video" and $data.purpose == "deliverable" then
      {role: "ASSISTANT", event: "final_video", assetId: $data.assetId}
    else empty end
  elif .kind == "interaction" and .payload.response == null then
    {role: "ASSISTANT", event: "interaction", executionId, interaction: .payload.interaction}
  else empty end
]
