# Native Craft Lens

VS Code / Cursor extension that restores the **craft and familiarity** feeling when AI writes code in languages you do not deeply know.

Inspired by the observation that even when AI writes the code, deep caring, passive comprehension, and tight intentional loops still require familiarity with the language.

## Features (v0.1)

- **Explain in Native Language**: Select code → map it into your preferred language’s mental model (default C#).
- **Native Lens Panel**: Side panel for dual-view exploration (scaffold).
- **Craft Suggestions**: Ask the AI to propose small intentional polish (UX feel, performance, clarity) rather than just shipping features.

## Setup

1. Clone the repo
2. `npm install`
3. Open in VS Code / Cursor
4. Press F5 to launch the Extension Development Host

## Configuration

`nativeCraft.preferredLanguage` — your native language for mappings (e.g. `C#`, `TypeScript`).

## Roadmap

- Live dual-view with editable native-language overlay
- Mental-model canvas (components, data flow, ownership)
- Style transfer from your existing native-language projects
- Reliable hot-reload / debugging assistance that keeps the craft loop alive
- Clean boundary isolation helpers for unavoidable foreign-language pieces

## License

MIT
