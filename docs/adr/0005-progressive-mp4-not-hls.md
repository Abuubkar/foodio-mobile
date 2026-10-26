---
status: accepted
---

# Clips are progressive MP4, not HLS

Two independent research passes converged on the same answer, so it is recorded before anyone reaches for adaptive streaming out of habit.

`expo-video`'s `useCaching` survives relaunch and is exactly what a scrolling feed wants — but **it does not work for HLS on iOS**. Separately, no freely-usable HLS fixture we could find is either portrait or food, so an HLS path could not even be exercised against realistic content.

## Consequences

- `Clip.mediaUrl` points at a progressive `.mp4`. The measured cost is ~2.5 Mbps at 720×1280, roughly 3 MB for a 10-second clip.
- No adaptive bitrate. On a poor connection a clip buffers rather than degrading, which makes the cellular question in the feed's playback policy sharper, not softer.
- DASH is Android-only per the SDK 57 docs, so it is not a cross-platform escape hatch.
- Revisit when clips are self-hosted: owning the transcode removes both constraints at once, since the iOS caching gap is the only reason to prefer progressive at this size.
- **Live is what will force that revisit.** There is no progressive-MP4 live stream — live is LL-HLS or WebRTC — so the clip media carries a `kind` and the player chooses its source, rather than every call site assuming a file. See backend [ADR-0023](https://github.com/Abuubkar/foodio-backend/blob/main/docs/adr/0023-a-clips-context-is-optional-and-moderation-is-the-gate.md).

Detail in the research on branches `research/expo-video-feed` and `research/playable-clips`.
