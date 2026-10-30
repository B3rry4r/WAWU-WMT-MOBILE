# AI voice provider facts (ElevenLabs), for the Studio tools

Read 23 Oct 2026 from the provider's public documentation (`https://elevenlabs.io/docs`, every page below has a
clean copy at the same URL plus `.md`) and from free read calls with the owner's key. Written for AITOOLS-02 to
AITOOLS-06. The provider's name is for builders only: nothing a person sees names it (R-68). Base URL for every
route: `https://api.elevenlabs.io`. Every call sends the key in the `xi-api-key` header. Facts in a task come from
this file or from a real response, never from the design (WORKFLOW rule 7).

## What the free read calls showed (no generation, upload, clone, dub or agent creation)

Run once, 23 Oct 2026, read calls only. Nothing about the account other than what a call returned is written here.

| Call | Answer | What it tells us |
|---|---|---|
| `GET /v1/user/subscription`, `GET /v1/user` | 401, the key lacks the permission `user_read` | The plan name and the credits left cannot be read with this key. The plan name is NOT KNOWN. Music is "for paid subscribers" per the docs, so the owner confirms the plan covers every tool below. |
| `GET /v1/history` | 401, the key lacks `speech_history_read` | The key has scoped permissions. Each tool's own permission is only proven by its own call. |
| `GET /v1/models` | 200, 11 models | Text to speech models listed (below). The list holds no speech to text, music, sound effect or dubbing model. |
| `GET /v1/voices` | 200 | Voices of three kinds are listed (`premade`, `cloned`, `professional`): the account can hold cloned voices. |
| `GET /v1/voices?page_size=100` (24 Oct 2026, AITOOLS-07, read only) | 200, 24 voices | Each voice holds `voice_id`, `name`, `category` and `preview_url`, an https link to a short sample of that voice. The Hub reads the list once an hour and serves the sample itself (`GET /ai-tools/voices/{id}/sample`), so the provider's address never leaves the adapter; a voice with no https `preview_url` has no sample. Voice making, speech and delete were NOT RUN on the real key. |
| `GET /v1/convai/agents`, `/convai/settings`, `/convai/phone-numbers` | 200, no agents yet | The key can read and (by scope name) use the agents platform. |
| `GET /v1/dubbing/project`, `/v1/audio-isolation/history`, `/v1/music/finetunes`, `/v1/workspace/webhooks` | 200 | The key can read these areas. |
| `GET /v1/speech-to-text/transcripts` | 422 | Not a permission failure (a validation answer). The documented read is `GET /v1/speech-to-text/transcripts/{id}`; it was not called (no id). |

A read that works does not prove the generate route works for this key. Each AITOOLS task's first provider call is
its first proof; until it has run, the tool's provider call is NOT RUN against the real provider (R-20 style: report
it). The permission scopes the owner must tick on the key for the tools: speech to text, audio isolation, sound
effects, music, dubbing, agents (write), voices (write). That list is for the owner; no task waits on it to be built
against the stand-in.

Text to speech models the account lists (from `GET /v1/models`, text limit per request, languages): `eleven_v4`
(10,000, 94), `eleven_v4_turbo` (10,000, 94), `eleven_v3` (5,000, 74), `eleven_multilingual_v2` (10,000, 29),
`eleven_flash_v2_5` (40,000, 32), `eleven_turbo_v2_5` (40,000, 32), `eleven_flash_v2` (30,000, 1, English),
`eleven_turbo_v2` (30,000, 1), plus two speech to speech models. The Hub's `AI_VOICE_MODEL` setting picks the model
for VoiceOver today.

## The tools the design draws (PT1) and the provider route that serves each

| Tool on PT1 | Provider route | Async? | Serves it? |
|---|---|---|---|
| VoiceOver (250 a minute) | `POST /v1/text-to-speech/{voice_id}` | no, one call | built (AITOOLS-01) |
| Quick voice (125 a minute) | the same route with `model_id=eleven_flash_v2_5` | no | yes (see "Quick voice" below) |
| Captions (15 a minute) | `POST /v1/speech-to-text` | no (or webhook) | yes |
| Clean audio (400 a minute) | `POST /v1/audio-isolation` | no, one call | yes |
| Music track (500) | `POST /v1/music` | no, one long call | yes |
| Sound effect (75) | `POST /v1/sound-generation` | no, one call | yes |
| Dubbing (from 1,500 a minute) | `POST /v1/dubbing/project`, `POST /v1/dubbing/project/{id}/language`, `GET .../language/{language_id}` | yes | yes, audio and subtitles only (no dubbed video) |
| Receptionist (20 a message) | agents: `POST /v1/convai/agents/create`, then a text-only conversation over a socket | per message | yes for the engine; the design draws no screen (G-AITOOLS-06-1) |

Every tool the design draws can be served by the provider. No designed tool lacks a provider, so no provider is
invented. What is missing is design (the boards after PT2) and a few owner choices; they are gap rows.

### Text to speech (VoiceOver, Quick voice)
Doc: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- `POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_128`, JSON body `{ text, model_id?, language_code?, voice_settings?, seed? }`. Answer: the audio bytes (`audio/mpeg` for mp3 formats). Synchronous. The Hub's adapter already sends exactly this (AITOOLS-01), so its wire shape now matches the documentation.
- Limits: the text limit is per model (table above). The Hub caps a job at `points.max_chars_per_job` (5,000) and 10 minutes, below every model's limit.
- Quick voice: the design gives the tile a bolt icon and half VoiceOver's price and no board. The default built here is the faster, cheaper model on the same voices (`eleven_flash_v2_5`, which also accepts a longer text than the Hub allows). The other reading, a person's own voice from a short recording (`POST /v1/voices/add`, https://elevenlabs.io/docs/api-reference/voices/ivc/create, multipart `name` and `files`, answers `voice_id`), is already built for the Voice Intro (VOICE-01) and offered on PT2 as "Your voice". The owner confirms which is meant (Q in AITOOLS-02).

### Speech to text (Captions)
Doc: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
- `POST /v1/speech-to-text`, multipart form: `model_id` (required; `scribe_v2` in the documentation's examples), `file` (audio or video, "all major audio and video formats", under 5.0 GB, 100 ms minimum) or `source_url`, optional `language_code` (ISO 639-1 or 3; detected when absent), `timestamps_granularity` (`word` or `character`), `diarize`, `num_speakers` (up to 32), `tag_audio_events`, `no_verbatim` (scribe_v2), `additional_formats` (a list of export options for the transcript), `webhook` (answers early, result sent to a webhook).
- Answer 200 (synchronous): `{ language_code, language_probability, text, words[{text,type,start,end,speaker_id}], audio_duration_secs, transcription_id, additional_formats[{requested_format,file_extension,content_type,is_base64_encoded,content}] }`. 202 when `webhook` is set. The page does not list the export option names, so the Hub builds the subtitle file (SRT) itself from the word timestamps and keeps the plain text; it asks for `additional_formats` only once a real response has shown the names.
- The answer carries `audio_duration_secs`, which the Hub can compare with the length it priced (fact for the points task: the provider reports the true length only after the call).
- A transcript is also kept by the provider unless `enable_logging=false`, which only enterprise accounts may use. `DELETE /v1/speech-to-text/transcripts/{id}` removes one (https://elevenlabs.io/docs/api-reference/speech-to-text/delete). The Hub calls it after storing the result so the provider keeps no copy of a person's words. **Real run, 24 Oct 2026 (one Captions job, 5 s clip): the first DELETE, 89 ms after the answer, got 404 `transcript_not_found` (the provider had not stored the transcript yet) and a GET by id still returned 200 with the full text; a DELETE about 40 s later answered 200 and the next GET 404.** So a 404 soon after the answer means "not stored yet", not "gone": the Hub tries again over the next minute and then by a sweep, and counts a 404 as gone only 10 minutes after the answer. **Round 3 (verifier, 24 Oct 2026, 6 real Captions runs): a DELETE sent 0.1 to 0.3 s after the answer also answered 200 (or 404) and the transcript was still readable (GET 200) 2 to 9 minutes later in 4 of 6 runs, so a 2xx is not proof either. The Hub now follows every DELETE of a transcript with `GET /v1/speech-to-text/transcripts/{id}` (status only) and keeps the job's note until that GET says 404; it retries on the same schedule and sweep. NOT RUN against the real key in round 3 (the stand-in models it: `[[ack-then-appear:MS]]`).** A cleaned recording's item has no per-id read the Hub uses (4 of 4 real items were gone after one 204), so its 2xx still clears the note and its 404 waits 10 minutes.

### Voice isolator (Clean audio)
Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/convert and https://elevenlabs.io/docs/overview/capabilities/voice-isolator
- `POST /v1/audio-isolation`, multipart form: `audio` (the file, required), `file_format` (`other` or `pcm_s16le_16`). Answer: the cleaned audio as a file download. Synchronous.
- Accepts audio (AAC, AIFF, OGG, MP3, OPUS, WAV, FLAC, M4A) and video (MP4, AVI, MKV, MOV, WMV, FLV, WEBM, MPEG, 3GPP). Up to 500 MB and 1 hour. Provider cost: 1,000 characters per minute of audio. "Not specifically optimized for isolating vocals from music".
- History: `GET /v1/audio-isolation/history` and `DELETE /v1/audio-isolation/history/{id}` exist; the Hub deletes the item after storing the result. **Real run, 24 Oct 2026 (one job, 5 s clip): the answer was 200 `audio/mpeg`, 205,888 bytes, and carried the item's id in the `audio-isolation-id` response header; there is no `history-item-id` header (this line and the first build assumed that name, which was wrong). The history held the item (1); `DELETE /v1/audio-isolation/history/{id}` by hand answered 204 and the history then held 0.**

### Sound effects (Sound effect)
Docs: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert and https://elevenlabs.io/docs/overview/capabilities/sound-effects
- `POST /v1/sound-generation?output_format=mp3_44100_128`, JSON `{ text (required), duration_seconds?, loop?, prompt_influence?, model_id? }`. `duration_seconds` is 0.5 to 30 (the overview page says 0.1 to 30: the Hub keeps to 0.5 to 30, the API page). Models `eleven_text_to_sound_v2` (default) and `eleven_text_to_sound_v3`. Answer: audio bytes. Synchronous. Maximum 30 seconds a generation. Provider cost: 40 credits a second when a duration is given.

### Music (Music track)
Docs: https://elevenlabs.io/docs/api-reference/music/compose and https://elevenlabs.io/docs/overview/capabilities/music
- `POST /v1/music?output_format=mp3_44100_128` (or `auto`), JSON `{ prompt | composition_plan, music_length_ms (3,000 to 600,000), model_id (music_v1 default, music_v2, music_v2_5), force_instrumental, seed }`. `prompt` and `composition_plan` cannot be sent together; `music_length_ms` and `force_instrumental` go with `prompt` only. Answer: audio bytes. One request, no job id: it can run for a long time, so the Hub's timeout for this tool is longer than VoiceOver's.
- The overview says a track runs 3 seconds to 5 minutes; the API page allows up to 600,000 ms. The Hub keeps to the shorter limit (5 minutes) until a real response says otherwise.
- "The Music API is available for paid subscribers." "Cleared for nearly all commercial uses" (its music terms page, https://elevenlabs.io/music-terms, says what each plan allows: the owner reads it before launch; Q in AITOOLS-03).
- Also exist, not built: `POST /v1/music/video-to-music` (videos in, up to 10, a description up to 4,100 characters), stem separation, inpainting, finetunes.

### Dubbing (Dubbing)
Docs: https://elevenlabs.io/docs/api-reference/dubbing/create-project, https://elevenlabs.io/docs/api-reference/dubbing/language-targets/create-language-target, https://elevenlabs.io/docs/api-reference/dubbing/language-targets/get-language-target, https://elevenlabs.io/docs/overview/capabilities/dubbing
- Three calls. (1) `POST /v1/dubbing/project`, multipart: `file` (audio or video up to 3 GiB) or `source_url`, `source_language` (BCP-47, detected when absent), `model_id` (`dubbing_v1` or `dubbing_v2`, default `dubbing_v2`, fixed at create), `webhook_ids`, `target_language` (shortcut that also queues the first language). Answer 201 at once `{ project_id, status: queued | preparing | ready | failed, media, language_ids }`. (2) `POST /v1/dubbing/project/{project_id}/language` JSON `{ target_language (BCP-47), voice_settings? }` answers `{ language_id, status }`. (3) `GET /v1/dubbing/project/{project_id}/language/{language_id}` until `status` is `completed` (`queued`, `processing`, `completed`, `stale`, `failed`); `outputs` then holds signed links, valid one hour: `lossless_audio` (FLAC) and `subtitles` (WebVTT). The provider recommends a webhook over polling; the Hub polls (see AITOOLS-05).
- A project charges at least one language the moment it is created, before any output exists. A failed dub's refund by the provider is not stated in the pages read: the Hub's points go back regardless (hold released).
- The new project API answers the dubbed AUDIO track and subtitles only. It does not return a dubbed video. A person who uploads a video gets the dubbed audio, not a video (G-AITOOLS-05-1).
- "Standard" and "premium" dubbing: the plan file prices `dub_standard_per_min_lang` (1,500) and `dub_premium_per_min_lang` (6,500) a minute for each language. Which provider model each means is NOT stated in the provider pages read (`dubbing_v1` against `dubbing_v2` is the only model choice on the route). The design draws "From 1,500 a minute" and no choice, so only the standard price is built; the premium figure waits for the owner (Q in AITOOLS-05).
- Limits: source up to 3 GiB through the API (the app and docs say 1 GB or 180 minutes in the provider's own app); up to 32 speakers; 90+ languages. The Hub's own limit is the plan's `maxAudioMinPerJob` (10) times languages, and its own upload size cap.
- Cloned speaker voices: `cloning_strength` 0 to 10 in `voice_settings`. A speaker whose voice the provider does not permit cloning gets a replacement voice and a `voices_not_permitted` warning.

### Agents (Receptionist)
Docs: https://elevenlabs.io/docs/api-reference/agents/create, https://elevenlabs.io/docs/eleven-agents/guides/chat-mode, https://elevenlabs.io/docs/eleven-agents/api-reference/eleven-agents/websocket, https://elevenlabs.io/docs/api-reference/conversations/get-signed-url
- `POST /v1/convai/agents/create` JSON `{ conversation_config (required), platform_settings?, workflow?, name?, tags? }` answers `{ agent_id }`. Text-only chat is `conversation_config.conversation.text_only = true` (or a runtime override), so no audio is used.
- A conversation runs over a socket (`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...`, or a signed link from `GET /v1/convai/conversation/get-signed-url?agent_id=...`): the Hub sends a `user_message` and reads `agent_response` events. Phone numbers and telephony (SIP, Twilio) exist on the same platform.
- What the design draws: one tile, "Receptionist", "20 a message". There is no board for setting one up or talking to one. What a Receptionist does for a creator is not drawn, so the engine is specified (above) and the screens are a gap.
- Voice (`receptionist_voice_per_min`, 400 a minute, in the plan file) is not on the tile, so it is not built.

## Uploads the Hub must take (Captions, Clean audio, Dubbing)
The Hub already presigns uploads by folder with an allowed content-type list and a byte cap
(`src/storage/dto/presign-upload.dto.ts`: `voice/sample` for the Voice Intro, `community/message-video` and
`community/message-voice`). Each tool that takes a file adds one private folder (never served to anyone but the
owner, never counted in the 5-item allowance) in the same way, and reads it back with `StorageService.readStored`.
The provider reads the file only for one run; the Hub deletes the input after the job settles. Audio types the Hub
serves today: `audio/mpeg`, `audio/wav`, `audio/mp4`, `audio/aac`; video: `video/mp4`, `video/quicktime`,
`video/webm`. Other types the provider accepts (FLAC, OGG, OPUS) are not offered until the Hub serves them.

## What we cannot know before a call (each is a "NOT RUN" until a real run)
- The plan the account is on, and its credits (the key cannot read it).
- Whether the key's scopes cover every generate route above.
- The exact bodies of a failed call on each route (the Hub treats 429 and 5xx as `unavailable`, other 4xx as `rejected`, as AITOOLS-01 does).
- The real time a music track, a dub and a long transcript take.

---

# Studio 2: the new tools (R-109, 30 Oct 2026)

Read 30 Oct 2026 from the owner's boss's file (`api-reference-2.json`, the main API, 288 paths) with the public description (`openapi-30oct.json`) as the cross-check. Nothing was called (no key used). Where the two differ it is said. Every route below is reached only through the one seam `AI_VOICE_PROVIDER` (no provider name reaches a person, R-68). Facts for a builder come from here or from a real response, never from the design.

## Credits are limited: how every task uses the real provider
- Builders and verifiers use the stand-in (`scripts/dev/voice-standin.cjs`) for every test. Each task adds its routes and failure markers to it.
- A task makes at most ONE real provider call per tool, at the smallest input that proves it (the shortest text, one 512 px image, the shortest video, the cheapest model that works), and only when the lead names that call in the brief. No real call is ever repeated to debug a problem: read the stand-in, the logs and this file instead.
- Each real call is logged in the task's Current state with the credits it used. **The files show no credit field in any request or response and no cost header** (searched: no `x-character-count`, no usage header on any route). So credits are measured as the account's balance before and after the call: `GET /v1/user/subscription` (`character_count` and `character_limit`), which needs the key's `user_read` permission (the 23 Oct read got 401 for it), or the provider's dashboard number read by the owner before and after. Until one of those is in place a proof call's cost is NOT KNOWN and the task says so.
- The proof call for each tool is written in its task file, with its expected cost (a number where the files give one, otherwise NOT KNOWN).

## What the account must have (everything below)
| Need | Tools | Known? |
|---|---|---|
| Enough credits; the plan and credits cannot be read with this key | all | NOT KNOWN (owner has requested a purchase) |
| Key permission `user_read` (to measure credits); each route's own scope (only its own call proves it) | all | NOT KNOWN |
| A plan that allows instant voice cloning (voice slots on the account) | Clone your own voice | NOT KNOWN (the number of voice slots is not in the files) |
| "Music API is for paid subscribers" (a 403 `Subscription required` is documented on video to music) | Music for a video, Split a song | NOT KNOWN for our plan |
| The Studio API: "Only specifically whitelisted accounts can access the Studio API. If you need access please contact our sales team." (the file's `studio` tag) | Podcast maker (Audiobook does NOT use it, see below) | NOT KNOWN; the owner asks the provider |
| ByteDance approval: the Seedream and Seedance models are "disabled by default and require explicit approval before use. Contact support" | none by default (no task uses them) | not requested |
| Flows (image, video) enabled for the key | Make an image, Edit a photo, Make a video, Talking photo | NOT KNOWN (the 23 Oct read calls did not test it) |
| Agents write scope, and a plan that allows agents (a 23 Oct read showed the agent list readable and empty) | Receptionist | NOT KNOWN |

## Make an image, Edit a photo (AITOOLS-09)
- Routes: `POST /v1/flows/image` (start), `GET /v1/flows/image/{generation_id}` (read), `GET /v1/flows/image` (list; not used). Files and public file agree on every model, enum and default.
- **Asynchronous, polled.** The POST answers at once `{ id, status: "pending" }`. The read answers `pending`, `generating`, `completed` (`content_url`, `content_mime_type`) or `failed` (`failure_reason`: `timeout`, `model_error`, `moderated`, `invalid_parameters`, `dependency_failed`, `charging_failed`, `internal_error`; `error_message`). `content_url` is signed and lasts about an hour (read again for a fresh one). `webhook` (`{type:"all"}` or `{type:"ids",ids:[...]}`) sends the same body to the workspace's flows webhooks instead; the Hub polls. "Failed generations are not charged."
- Request: `model_id` and `prompt` required (the 11 image models are a oneOf by `model_id`). The model the Hub uses by default is `gemini-3.1-flash-image`: up to 14 reference `images`, no mask, `aspect_ratio` auto, 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, 1:4, 4:1, 1:8, 8:1; `resolution` 512, 1K (default), 2K, 4K. It needs no approval. Other models are in the setting's reach: `gemini-3.1-flash-lite-image` (1K only, up to 14 images), `gemini-3-pro-image`, `gemini-2.5-flash-image` (5 images), five GPT-image models (up to 5 or 10 images, a `mask`, `quality`), two Seedream models (ByteDance, approval).
- **No output-format field and no pixel size**: the size follows `aspect_ratio` and `resolution` (or `quality`). The example type is `image/png`; the real type is read from `content_mime_type`. File size of an output: NOT KNOWN (read from the first real response).
- **Edit a photo** is the same route with `images`: each reference is `{type:"asset", asset_id}` (a file uploaded first with `POST /v1/assets`, multipart `asset` and `name`, answers `asset_id`; `DELETE /v1/assets/{asset_id}` exists), `{type:"generation", generation_id}` (an earlier output) or `{type:"inline_base64", content_base64, mime_type}` (up to 25 MB decoded; jpeg, png, webp, heic, heif; kept only as an ephemeral asset with no guaranteed retention). The Gemini models edit by prompt only. Default (lead): the Hub uploads the person's photo as an asset, uses it, and deletes the asset afterwards (as it deletes transcripts), so the Hub's memory stays flat and the provider keeps no copy.
- Not known: credits per image (any model); prompt length limit per model; whether our key may use Flows.

## Make a video, Talking photo (AITOOLS-10)
- Routes: `POST /v1/flows/video`, `GET /v1/flows/video/{generation_id}` (same lifecycle, failure reasons and one-hour link as images), `GET /v1/flows/video`.
- Default model for Make a video: `veo-3.1-fast-generate-001` (no approval): `prompt` required, `duration_secs` "4", "6" or "8" (a string), `aspect_ratio` 16:9 or 9:16, `resolution` 720p (default), 1080p, 4K, `generate_audio` (default true), `negative_prompt`, `seed`, `enhance_prompt`, `start_frame` and `end_frame` (an image reference each; this is photo to video), `images` (up to 3 references, needs the 8 second length, cannot be mixed with start or end frame). The 4 second, 720p, no-audio request is the smallest.
- Video editing of a person's own clip does not exist in the files (only Seedance takes reference videos, as references for a new clip).
- **Talking photo**: `creatify-aurora`, `image` (one) and `audio` (one speech file, mpeg or wav) both required, no prompt; `resolution` 480p or 720p (default 720p); `guidance_scale` and `audio_guidance_scale` 0 to 5. The video's length is the audio's. The longest audio it takes: NOT KNOWN. Output shape follows the photo.
- Output: `video/mp4` in the examples; size and frame rate NOT KNOWN. A video piece takes `video/mp4` and `video/quicktime` up to 512 MB (the Hub's rule).
- Not used, by default: Seedance (needs approval; also reference videos and audios). Not known: credits per second or per clip (any model); the time a clip takes.

## Dialogue (AITOOLS-11)
- `POST /v1/text-to-dialogue` (also `/stream` and `/with-timestamps` variants, not used), JSON: `inputs` (a list of `{text, voice_id}`, both required; at most 10 different voices; "keep the total character count across all inputs at or below 2,000 per request"), `model_id` (default `eleven_v3`), `language_code`, `settings`, `seed`, `apply_text_normalization` (auto, on, off), `pronunciation_dictionary_locators` (up to 3), `previous_text` and `future_text` (100 characters each), `previous_request_ids` and `next_request_ids` (up to 3, to continue a longer scene). Query `output_format` (default `mp3_44100_128`).
- **Synchronous**: the answer is the audio file (`application/octet-stream`; mp3 for the default format). Credits: charged per character on the speech models (the speech flow says "charged per character"); the rate for `eleven_v3`: NOT KNOWN.

## Voice changer (AITOOLS-11)
- The boss's file names it `POST /v1/speech-to-speech/{voice_id}` (also `/stream`); the public file names the same capability `/v1/voice-changer/{voice_id}`. The Hub follows the boss's file and reads the public name when it changes.
- Multipart: `audio` (required; the recording whose words, timing and emotion are kept), `model_id` (default `eleven_english_sts_v2`; the model must be able to convert voices: `can_do_voice_conversion` in `GET /v1/models`; the account listed two speech to speech models on 23 Oct, their ids were not recorded), `voice_settings` (a JSON string), `seed`, `remove_background_noise` (default false), `file_format` (`other` or `pcm_s16le_16`). Query `output_format` (default mp3_44100_128), `enable_logging`.
- **Synchronous**; the answer is the audio. Input length and size limits, and credits per minute: NOT in the files (NOT KNOWN).

## Clone your own voice, quick (AITOOLS-11)
- `POST /v1/voices/add`, multipart `name`, `files` (one or more recordings), `remove_background_noise`, `description`, `labels`; answers `{ voice_id, requires_verification }`. `DELETE /v1/voices/{voice_id}` removes it. Already built for one run only (AITOOLS-07, "Your voice" in VoiceOver); this tool keeps the clone for the person until they remove it.
- Not known: the shortest and longest sample the route takes; credits for a clone (if any); how many voices the plan holds. The first proof call reads the answer's error text for the first two.

## Music for a video (AITOOLS-12)
- `POST /v1/music/video-to-music`, multipart: `videos` (a list, at most 10, combined in order; **total 200 MB, up to 600 seconds in all**), `description` (optional, up to 1,000 characters in the boss's file, 4,100 in the public file: the Hub uses 1,000), `tags` (up to 10), `model_id` (`music_v1` default, `music_v2`, `music_v2_5`), `sign_with_c2pa`. Query `output_format`. Errors: 403 `Subscription required`, 422.
- **Synchronous and long**; the answer is the audio (type by `output_format`). The provider returns music only: no video with sound comes back, and the Hub has no tool to mix them, so the person gets an audio file.
- Credits: NOT KNOWN.

## Split a song, stems (AITOOLS-12)
- `POST /v1/music/stem-separation`, multipart `file` (the audio), `stem_variation_id` (`two_stems_v1` or `six_stems_v1`, default `six_stems_v1`), `output_format` (query), `sign_with_c2pa`. "This endpoint might have high latency, depending on the length of the audio file."
- **Synchronous; the answer is a ZIP** (`application/octet-stream`) with one audio file per stem in the requested format. The Hub unzips it and stores each stem as its own file. The names inside the zip and the size and length limits of the input: NOT in the files (NOT KNOWN; the first proof call reads them).
- Credits: NOT KNOWN.

## Audiobook (AITOOLS-13)
- Default (lead): the Hub makes an audiobook on the speech route it already runs (`POST /v1/text-to-speech/{voice_id}`, API-FACTS above), one chapter at a time, each request's `previous_text` and `next_text` (the route has them, with `previous_request_ids` and `next_request_ids`) carrying the voice across the joins, and joins the mp3 pieces into one file. Why: the provider's Studio projects API (`POST /v1/studio/projects` with `from_document` .epub .pdf .txt, `from_url` or `from_content_json`, then `POST .../convert`, then a snapshot stream or archive) is allowlist-only (above), and the speech route is the one VoiceOver already proved on the real key (24 Oct). The Studio API stays an option behind the same seam if the owner is allowlisted.
- Limits: the text limit per request is per model (`eleven_v4` and `eleven_multilingual_v2` 10,000 characters; the Hub's job cap is a setting). An mp3 at 128 kbps is about 56 MB an hour; a piece file is at most 512 MB. Credits: per character, rate per model NOT KNOWN.

## Podcast maker (AITOOLS-13)
- `POST /v1/studio/podcasts` (Studio API, allowlisted), JSON: `model_id`, `mode` (`{type:"conversation", conversation:{host_voice_id, guest_voice_id}}` or `{type:"bulletin", bulletin:{host_voice_id}}`), `source` (`{type:"text", text}` or `{type:"url", url}` or a list of them), `quality_preset` (standard 128 kbps 44.1 kHz, or high 192 kbps), `duration_scale` (`short` under 3 minutes, `default` about 3 to 7, `long` over 7), `language` (two letters), `intro` and `outro` (1,500 characters each), `instructions_prompt` (3,000), `highlights`, `callback_url`, `apply_text_normalization`. Header `safety-identifier` (moderation) "Your workspace must be allowlisted to use this feature".
- "Create and auto-convert": the answer is the project (`project_id`, `can_be_downloaded`, ...). **Asynchronous**: read `GET /v1/studio/projects/{project_id}` until it can be downloaded, list `.../snapshots`, take the audio from `POST .../snapshots/{id}/stream` (or `/archive`), then `DELETE /v1/studio/projects/{project_id}`. The provider says its language model cost is covered for now and "you will still be charged for the audio generation", later both.
- Credits: NOT KNOWN (audio is per character on the speech models; the language model part is covered today and unpriced later).

## Receptionist: the talking agent (AITOOLS-06, POINTS-12, POINTS-19)
Built from the agents platform only. Not used: phone numbers, Twilio, SIP, WhatsApp, batch calling, the small-business receptionist routes, tools and MCP servers (R-109).
- **The agent:** `POST /v1/convai/agents/create` (`conversation_config` required; `name`, `tags`, `platform_settings`, `workflow` optional) answers `{ agent_id }`; `PATCH /v1/convai/agents/{agent_id}` edits; `DELETE` removes. In the config: `agent.prompt.prompt` (the instructions), `agent.prompt.llm` (a long list of model ids; the Hub picks one by a setting), `agent.first_message`, `agent.language` (default `en`; the files list no Yoruba, Igbo, Hausa or Pidgin code), `tts.voice_id` and `tts.model_id` (default `eleven_v4_turbo`), `conversation.text_only`.
- **What it knows (the knowledge base):** `POST /v1/convai/knowledge-base/text` (`text`, `name`), `/url` (`url`, `name`, optional auto-sync), `/file` (multipart `file`, `name`); each answers `{ id, name, folder_path }`. A document is then attached in the agent's config at `agent.prompt.knowledge_base`: a list of `{ type: file | url | text | folder, name, id, usage_mode: prompt | auto }`. `DELETE /v1/convai/knowledge-base/{documentation_id}` (with `force=true` it also leaves every agent that uses it). Which file types the route takes, the size per document and the number of documents per agent: NOT in the files (NOT KNOWN).
- **Talking to it, text:** over the agent socket (`wss`), with the text-only setting so no audio is used and no audio is priced. A signed link comes from `GET /v1/convai/conversation/get-signed-url?agent_id=` (hyphen spelling; `include_conversation_id=true` returns the conversation id and makes the link single use). How long a signed link lasts: NOT in the files.
- **Talking to it, voice:** the same socket (audio chunks both ways) or WebRTC: `GET /v1/convai/conversation/token?agent_id=` answers `{ token, conversation_id }`. The phone must capture the microphone and play the agent's voice live; whether the app's current audio package can stream (it records to a file and plays files) is NOT KNOWN and is POINTS-19's first question. WebRTC would need a native module and so a new build.
- **After it ends:** `GET /v1/convai/conversations/{conversation_id}` (status, metadata with the length) is how the Hub reads the real minutes. `POST /v1/convai/agents/{id}/simulate-conversation` goes away on 31 Oct 2026 and is not used.
- Credits per text message and per voice minute: NOT KNOWN (the language model and the voice are each priced; text-only "avoids audio pricing").

## Points ratio: what the provider charges, what we charge, and so the ratio
R-65: 1,000 points are ₦500 (note: `plans.config.json` `price_per_1000_points` holds 100000 kobo, which is ₦1,000: the builder of the first pricing task reads the live setting and says which is true). The ratio below is points we charge per provider credit. The plan's price per credit is NOT KNOWN (the key cannot read the plan), so the margin in naira waits for the owner's plan figure.

| Current tool | Provider cost per unit (source) | We charge today | Points per credit |
|---|---|---|---|
| Clean audio | 1,000 credits per minute (the isolator, this file's "Voice isolator") | 400 a minute | 0.400 |
| VoiceOver | 900 characters per minute (the Hub's setting) at 1 credit a character on the standard models = 900 (the files say only "charged per character"; the factor is NOT in the files) | 250 a minute | 0.278 if 1 credit a character |
| Quick voice | the same 900 characters on the faster model; its factor is NOT in the files (half would give 450 credits) | 125 a minute | 0.278 if half, 0.139 if equal |
| Sound effect | 40 credits per second when a duration is given (this file); the Hub sends one only if the person does | 75 a use | 0.375 at 5 s, 0.0625 at 30 s (flat price, so a cross-check only) |
| Captions | NOT KNOWN (the files have no price) | 15 a minute | NOT KNOWN |
| Music track | NOT KNOWN | 500 a track | NOT KNOWN |
| Dubbing | NOT KNOWN | from 1,500 a minute per language | NOT KNOWN |

Reading: where the provider cost is known the ratio is 0.28 to 0.40 points per credit. Two bases are used: **by character (speech): 0.278** and **by audio minute: 0.400**. A new tool is priced on the basis its provider bills; where its provider cost is NOT KNOWN its first proof call measures it (credits before and after, above) and the price is then cost times the basis ratio. The per-tool working is in each task's Provisional figures and in `scratchpad/studio2/PLAN.md`. The owner reviews every figure before the app ships.
