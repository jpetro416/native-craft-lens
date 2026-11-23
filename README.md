# Native Craft Lens

VS Code / Cursor extension that restores the **craft and familiarity** feeling when AI writes code in languages you do not deeply know.

Even when AI writes the code, the joy of building with intention, the passive "something feels off" glance, and the tight craft loop still depend on familiarity. This extension helps transfer that familiarity and rewards you for caring about the details.

## Features (v0.2)

- **Explain in Native Language** — maps selected code into your preferred mental model (default C#).
- **Craft Suggestions** — proposes small intentional polish instead of just shipping features.
- **Native Lens Dashboard** — interactive panel showing your craft progress.
- **Gamification**
  - Craft XP and levels (Novice → Apprentice → Craftsman → Master → Legend)
  - Daily craft streaks
  - Achievements (First Glance, Deep Diver, Polish Master, streaks, etc.)
  - Status bar indicator
- **Daily Craft Challenge** — short intentional prompts that keep the craft loop alive.
- Points for understanding, digging deeper, and reviewing AI output carefully.

## Setup

1. Clone the repo
2. `npm install`
3. Open in VS Code or Cursor
4. Press **F5** to launch the Extension Development Host

## Commands

- `Native Craft: Explain Selection in Native Language`
- `Native Craft: Suggest Craft Improvements`
- `Native Craft: Open Native Lens Dashboard`
- `Native Craft: Show Craft Progress`
- `Native Craft: Start Daily Craft Challenge`

## Configuration

- `nativeCraft.preferredLanguage` — your native language (default `C#`)
- `nativeCraft.enableGamification` — toggle points/levels/achievements

## Philosophy

The goal is not to replace your knowledge of a language. It is to keep you in the state of caring, deciding, and crafting — even when the syntax is unfamiliar. Gamification is light on purpose: it rewards the behaviors that restore the feeling the article described, not empty output volume.

## License

MIT
