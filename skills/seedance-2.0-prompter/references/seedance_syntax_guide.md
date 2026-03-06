# Seedance 2.0 Syntax Guide

This document covers the essential syntax for interacting with the Seedance 2.0 model, focusing on the `@` reference system.

## The `@` Reference System

The `@` symbol is used to tell the model how to use the uploaded assets. It allows you to assign specific roles to your images, videos, and audio files.

**Basic Syntax**: `@asset_name`

- `asset_name` corresponds to the filename of the uploaded asset.

### Common Usage Patterns

1.  **Defining Subject Identity**:
    - **Prompt**: `A man wearing a hat. Use @man_photo.jpg as the subject reference.`
    - **Explanation**: This tells the model to use the person from `man_photo.jpg` as the main character.

2.  **Defining Scene/Environment**:
    - **Prompt**: `A dog is running on the beach. Use @beach_scenery.png as the background.`
    - **Explanation**: This sets the scene from `beach_scenery.png` as the environment for the action.

3.  **Referencing Motion**:
    - **Prompt**: `Make the character dance. Reference the motion from @dance_video.mp4.`
    - **Explanation**: The character in the generated video will mimic the dance moves from `dance_video.mp4`.

4.  **Referencing Camera Language**:
    - **Prompt**: `A slow zoom-in on the product. Use the camera movement from @zoom_shot.mp4.`
    - **Explanation**: The generated video will replicate the camera motion of `zoom_shot.mp4`.

5.  **Using Start/End Frames**:
    - **Prompt**: `An animation of a logo appearing. Use @logo_start.png as the start frame and @logo_end.png as the end frame.`
    - **Explanation**: The video will animate the transition from the start image to the end image.

6.  **Combining Multiple References**:
    - **Prompt**: `Make the person from @person.jpg perform the action from @action.mp4 in the location from @location.png.`
    - **Explanation**: This is a powerful way to combine identity, motion, and scene from different sources.

7.  **Audio Reference**:
    - **Prompt**: `A video of a dramatic landscape, with the music from @epic_music.mp3.`
    - **Explanation**: The model will use the provided audio as the soundtrack and may even try to match the video's pacing to the music's rhythm.

### Best Practices

- **Be Explicit**: Clearly state the role of each `@` reference. Don't assume the model will guess correctly. For example, instead of just `... @my_video.mp4`, write `... using the camera motion from @my_video.mp4`.
- **One Role Per Asset (Usually)**: While an asset can sometimes serve multiple roles (e.g., a video providing both motion and a subject), it's clearer to assign one primary role per asset.
- **Name Assets Clearly**: Use descriptive filenames for uploaded assets (e.g., `character_ref.png`, `camera_dolly_in.mp4`). This makes the prompt easier to read and debug.
- **Check for Conflicts**: Ensure you are not giving contradictory instructions (e.g., referencing two different videos for the same motion).
