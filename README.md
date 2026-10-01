# WAWU WMT

The WAWU mobile app. Expo SDK 57, Expo Router, TypeScript.

```
npm ci
npm run web        # or: npm run ios / npm run android with a development build
npm run check      # everything CI runs
```

Set `EXPO_PUBLIC_API_URL` to the backend you want (staging for development).

## How work happens here

Every piece of work is a task file in `tasks/`. To hand one to a developer, or
to their Claude session, send one line:

```
You are the BUILDER for task A-06. Open tasks/A-06.md and follow it.
```

and later, to a different session:

```
You are the VERIFIER for task A-06. Open tasks/A-06.md and follow it.
```

The task file lists what to read. `CLAUDE.md` loads by itself.

- `docs/WORKFLOW.md`: the rules, the seven steps of a task, the verification passes, the stages
- `docs/PLAN.md`: who does what, the timeline, what's needed from Fintava
- `tasks/INDEX.md`: every task by person, with status and what it waits on
- `DECISIONS.md`: what has been decided and what is still open
