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
- A transcript is also kept by the provider unless `enable_logging=false`, which only enterprise accounts may use. `DELETE /v1/speech-to-text/transcripts/{id}` removes one (https://elevenlabs.io/docs/api-reference/speech-to-text/delete). The Hub calls it after storing the result so the provider keeps no copy of a person's words. **Real run, 24 Oct 2026 (one Captions job, 5 s clip): the first DELETE, 89 ms after the answer, got 404 `transcript_not_found` (the provider had not stored the transcript yet) and a GET by id still returned 200 with the full text; a DELETE about 40 s later answered 200 and the next GET 404.** So a 404 soon after the answer means "not stored yet", not "gone": the Hub tries again over the next minute and then by a sweep, and counts a 404 as gone only 10 minutes after the answer.

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
