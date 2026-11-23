import * as vscode from 'vscode';

interface CraftState {
  points: number;
  level: number;
  streak: number;
  lastCraftDate: string;
  achievements: string[];
  totalExplanations: number;
  totalCrafts: number;
  deepDives: number;
}

const ACHIEVEMENTS = {
  firstGlance: { id: 'firstGlance', name: 'First Glance', desc: 'Explained your first piece of AI code', points: 10 },
  deepDiver: { id: 'deepDiver', name: 'Deep Diver', desc: 'Dug deeper into the why 5 times', points: 25 },
  polishMaster: { id: 'polishMaster', name: 'Polish Master', desc: 'Completed 10 craft suggestions', points: 40 },
  streak3: { id: 'streak3', name: '3-Day Craft Streak', desc: 'Cared about the details three days in a row', points: 30 },
  streak7: { id: 'streak7', name: 'Week of Intent', desc: 'Seven-day craft streak', points: 70 },
  boundaryKeeper: { id: 'boundaryKeeper', name: 'Boundary Keeper', desc: 'Isolated a foreign-language piece cleanly', points: 20 },
  craftsman: { id: 'craftsman', name: 'Craftsman', desc: 'Reached level 5', points: 50 }
};

export function activate(context: vscode.ExtensionContext) {
  const stateKey = 'nativeCraft.state';

  const getState = (): CraftState => {
    const s = context.globalState.get<CraftState>(stateKey);
    return s || {
      points: 0,
      level: 1,
      streak: 0,
      lastCraftDate: '',
      achievements: [],
      totalExplanations: 0,
      totalCrafts: 0,
      deepDives: 0
    };
  };

  const saveState = (s: CraftState) => context.globalState.update(stateKey, s);

  const preferredLang = () =>
    vscode.workspace.getConfiguration('nativeCraft').get<string>('preferredLanguage') || 'C#';

  const gamificationOn = () =>
    vscode.workspace.getConfiguration('nativeCraft').get<boolean>('enableGamification') !== false;

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'nativeCraft.showProgress';
  statusBar.show();
  context.subscriptions.push(statusBar);

  function updateStatusBar() {
    const s = getState();
    const levelName = getLevelName(s.level);
    statusBar.text = `$(tools) Craft Lv.${s.level} ${levelName} | ${s.points} XP | 🔥${s.streak}`;
    statusBar.tooltip = `Native Craft Lens\nPoints: ${s.points}\nStreak: ${s.streak} days\nAchievements: ${s.achievements.length}`;
  }

  function getLevelName(level: number): string {
    if (level < 2) return 'Novice';
    if (level < 4) return 'Apprentice';
    if (level < 7) return 'Craftsman';
    if (level < 10) return 'Master';
    return 'Legend';
  }

  function calcLevel(points: number): number {
    return Math.floor(points / 50) + 1;
  }

  async function awardPoints(amount: number, reason: string) {
    if (!gamificationOn()) return;
    const s = getState();
    const today = new Date().toISOString().slice(0, 10);
    if (s.lastCraftDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      s.streak = s.lastCraftDate === yesterday ? s.streak + 1 : 1;
      s.lastCraftDate = today;
    }
    s.points += amount;
    const newLevel = calcLevel(s.points);
    const leveledUp = newLevel > s.level;
    s.level = newLevel;
    saveState(s);
    updateStatusBar();

    vscode.window.showInformationMessage(`+${amount} Craft XP — ${reason}`);
    if (leveledUp) {
      vscode.window.showInformationMessage(`🎉 Level up! You are now a ${getLevelName(s.level)} (Lv.${s.level})`);
    }
    checkAchievements(s);
  }

  function checkAchievements(s: CraftState) {
    const unlock = (key: keyof typeof ACHIEVEMENTS) => {
      const a = ACHIEVEMENTS[key];
      if (!s.achievements.includes(a.id)) {
        s.achievements.push(a.id);
        s.points += a.points;
        vscode.window.showInformationMessage(`🏆 Achievement unlocked: ${a.name} — ${a.desc} (+${a.points} XP)`);
      }
    };
    if (s.totalExplanations >= 1) unlock('firstGlance');
    if (s.deepDives >= 5) unlock('deepDiver');
    if (s.totalCrafts >= 10) unlock('polishMaster');
    if (s.streak >= 3) unlock('streak3');
    if (s.streak >= 7) unlock('streak7');
    if (s.level >= 5) unlock('craftsman');
    saveState(s);
    updateStatusBar();
  }

  updateStatusBar();

  const explainCmd = vscode.commands.registerCommand('nativeCraft.explainInNative', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }
    const selection = editor.document.getText(editor.selection) || editor.document.getText();
    if (!selection.trim()) {
      vscode.window.showWarningMessage('Nothing to explain');
      return;
    }
    const lang = preferredLang();
    const prompt = `You are helping a developer whose native language is ${lang}.\n\nExplain the following code by mapping concepts, idioms, and mental models to ${lang}.\nFocus on what it *means* and how a ${lang} developer would think about it.\nHighlight anything that would feel “off” or surprising. Be concise but precise.\n\nCode:\n\`\`\`\n${selection.slice(0, 3000)}\n\`\`\``;

    const result = await callModel(prompt);
    const s = getState();
    s.totalExplanations++;
    saveState(s);
    await awardPoints(5, 'explained AI-written code');
    showInteractiveResult(result, 'Explanation', lang);
  });

  const craftCmd = vscode.commands.registerCommand('nativeCraft.craftSuggestion', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const selection = editor.document.getText(editor.selection) || editor.document.getText();
    const lang = preferredLang();
    const prompt = `You are a Craft Agent. The developer’s native language is ${lang}.\n\nPropose 1-3 small, high-leverage craft improvements for this code (clarity, UX feel, performance, edge cases, elegance).\nExplain each in terms of their mental model. Help them care and decide, not just ship.\n\nCode:\n\`\`\`\n${selection.slice(0, 3000)}\n\`\`\``;

    const result = await callModel(prompt);
    const s = getState();
    s.totalCrafts++;
    saveState(s);
    await awardPoints(8, 'requested craft polish');
    showInteractiveResult(result, 'Craft Suggestions', lang);
  });

  const lensCmd = vscode.commands.registerCommand('nativeCraft.openNativeLens', () => {
    openDashboard(context);
  });

  const progressCmd = vscode.commands.registerCommand('nativeCraft.showProgress', () => {
    openDashboard(context);
  });

  const challengeCmd = vscode.commands.registerCommand('nativeCraft.dailyChallenge', async () => {
    const challenges = [
      'Find one thing in the current file that feels slightly off and explain why.',
      'Propose a better name for a function or variable that would make the intent clearer.',
      'Identify a place where ownership or data flow could be made more explicit.',
      'Spot a potential edge case the current code ignores.'
    ];
    const c = challenges[Math.floor(Math.random() * challenges.length)];
    const answer = await vscode.window.showInputBox({ prompt: `Daily Craft Challenge: ${c}`, placeHolder: 'Your observation...' });
    if (answer && answer.trim().length > 10) {
      await awardPoints(15, 'completed daily craft challenge');
      vscode.window.showInformationMessage('Nice. That’s the craft loop.');
    }
  });

  context.subscriptions.push(explainCmd, craftCmd, lensCmd, progressCmd, challengeCmd);

  function openDashboard(ctx: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
      'nativeCraftLens',
      'Native Craft Lens',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const s = getState();
    panel.webview.html = getDashboardHtml(s, preferredLang());

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.command === 'award') {
        const st = getState();
        if (msg.type === 'deep') st.deepDives++;
        saveState(st);
        await awardPoints(msg.points || 5, msg.reason || 'craft action');
        panel.webview.html = getDashboardHtml(getState(), preferredLang());
      } else if (msg.command === 'refresh') {
        panel.webview.html = getDashboardHtml(getState(), preferredLang());
      }
    });
  }
}

async function callModel(prompt: string): Promise<string> {
  try {
    const models = await vscode.lm.selectChatModels();
    if (models.length === 0) {
      return '(No language model available — connect one in Cursor/VS Code to get real mappings)\n\nPlaceholder: This would map the code into your native mental model and highlight what feels off.';
    }
    const response = await models[0].sendRequest(
      [vscode.LanguageModelChatMessage.User(prompt)],
      {},
      new vscode.CancellationTokenSource().token
    );
    let text = '';
    for await (const chunk of response.text) text += chunk;
    return text;
  } catch (e) {
    return `Error calling model: ${e}`;
  }
}

function showInteractiveResult(text: string, title: string, lang: string) {
  const panel = vscode.window.createWebviewPanel(
    'nativeCraftResult',
    title,
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );
  panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; line-height: 1.5; }
    h2 { color: #4fc3f7; }
    pre { background: #252526; padding: 12px; border-radius: 6px; white-space: pre-wrap; }
    button { background: #0e639c; color: white; border: none; padding: 8px 14px; margin: 6px 4px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1177bb; }
  </style>
</head>
<body>
  <h2>${title} → ${lang}</h2>
  <pre>${text.replace(/</g, '&lt;')}</pre>
  <button onclick="acquireVsCodeApi().postMessage({command:'award', points:3, reason:'marked as understood'})">I understand this</button>
  <button onclick="acquireVsCodeApi().postMessage({command:'award', points:10, reason:'dug deeper', type:'deep'})">Dig deeper (+10 XP)</button>
  <script>
    const vscode = acquireVsCodeApi();
  </script>
</body>
</html>`;
  // Note: message handling would need to be wired if we want live updates from this panel; for now the dashboard is the main interactive surface.
}

function getDashboardHtml(state: CraftState, nativeLang: string): string {
  const levelName = (() => {
    if (state.level < 2) return 'Novice';
    if (state.level < 4) return 'Apprentice';
    if (state.level < 7) return 'Craftsman';
    if (state.level < 10) return 'Master';
    return 'Legend';
  })();
  const nextLevelPoints = state.level * 50;
  const progress = Math.min(100, ((state.points % 50) / 50) * 100);
  const unlocked = state.achievements.map(id => {
    const a = Object.values(ACHIEVEMENTS).find(x => x.id === id);
    return a ? `<li>🏆 ${a.name} — ${a.desc}</li>` : '';
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    h1, h2 { color: #4fc3f7; }
    .card { background: #252526; padding: 16px; border-radius: 8px; margin: 12px 0; }
    .bar { background: #333; height: 12px; border-radius: 6px; overflow: hidden; }
    .fill { background: linear-gradient(90deg, #4fc3f7, #81c784); height: 100%; width: ${progress}%; }
    button { background: #0e639c; color: white; border: none; padding: 10px 16px; margin: 6px 4px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1177bb; }
    .streak { font-size: 1.4em; }
  </style>
</head>
<body>
  <h1>Native Craft Lens</h1>
  <p>Mental model language: <strong>${nativeLang}</strong></p>

  <div class="card">
    <h2>Level ${state.level} — ${levelName}</h2>
    <p>${state.points} Craft XP</p>
    <div class="bar"><div class="fill"></div></div>
    <p style="font-size:0.9em; opacity:0.8;">Next level at ${nextLevelPoints} XP</p>
    <p class="streak">🔥 Craft Streak: ${state.streak} day${state.streak === 1 ? '' : 's'}</p>
  </div>

  <div class="card">
    <h2>Stats</h2>
    <p>Explanations: ${state.totalExplanations} &nbsp;|&nbsp; Craft reviews: ${state.totalCrafts} &nbsp;|&nbsp; Deep dives: ${state.deepDives}</p>
  </div>

  <div class="card">
    <h2>Achievements</h2>
    <ul>${unlocked || '<li>None yet — start crafting!</li>'}</ul>
  </div>

  <div class="card">
    <h2>Actions</h2>
    <button onclick="acquireVsCodeApi().postMessage({command:'refresh'})">Refresh</button>
    <p style="opacity:0.7; font-size:0.9em;">Use the Command Palette for Explain, Craft Suggestions, and Daily Challenge.</p>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
  </script>
</body>
</html>`;
}

export function deactivate() {}
