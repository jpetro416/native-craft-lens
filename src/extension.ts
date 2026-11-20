import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const preferredLang = () =>
    vscode.workspace.getConfiguration('nativeCraft').get<string>('preferredLanguage') || 'C#';

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
    const prompt = `You are helping a developer whose native language is ${lang}.

Explain the following code by mapping concepts, idioms, and mental models to ${lang}.
Focus on what it *means* and how a ${lang} developer would think about it.
Keep it concise but precise. Highlight anything that would feel “off” or surprising.

Code:
\`\`\`\n${selection}\n\`\`\``;

    try {
      const models = await vscode.lm.selectChatModels({ family: 'gpt' }); // or any available
      if (models.length === 0) {
        vscode.window.showInformationMessage('No language model available. Falling back to placeholder.');
        showResult(`Native mapping to ${lang} (placeholder):

This would explain the selection in ${lang} terms once a model is connected.`);
        return;
      }

      const model = models[0];
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

      let text = '';
      for await (const chunk of response.text) {
        text += chunk;
      }
      showResult(text);
    } catch (err) {
      vscode.window.showErrorMessage(`Native Craft error: ${err}`);
    }
  });

  const lensCmd = vscode.commands.registerCommand('nativeCraft.openNativeLens', () => {
    const panel = vscode.window.createWebviewPanel(
      'nativeCraftLens',
      'Native Craft Lens',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(preferredLang());
  });

  const craftCmd = vscode.commands.registerCommand('nativeCraft.craftSuggestion', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.document.getText(editor.selection) || editor.document.getText();
    const lang = preferredLang();

    const prompt = `You are a Craft Agent for a developer who cares deeply about intentional building.
Their native language is ${lang}.

Look at this code and propose 1-3 small, high-leverage craft improvements (clarity, UX feel, performance, edge cases, elegance).
Explain each in terms of the developer’s mental model. Do not just ship features — help them care and decide.

Code:
\`\`\`\n${selection}\n\`\`\``;

    try {
      const models = await vscode.lm.selectChatModels();
      if (models.length === 0) {
        showResult(`Craft suggestions for ${lang} (placeholder):

1. Make ownership clearer
2. Tighten the feedback loop around this section
3. Surface edge-case intent`);
        return;
      }

      const response = await models[0].sendRequest(
        [vscode.LanguageModelChatMessage.User(prompt)],
        {},
        new vscode.CancellationTokenSource().token
      );

      let text = '';
      for await (const chunk of response.text) {
        text += chunk;
      }
      showResult(text);
    } catch (err) {
      vscode.window.showErrorMessage(`Craft error: ${err}`);
    }
  });

  context.subscriptions.push(explainCmd, lensCmd, craftCmd);
}

function showResult(text: string) {
  const panel = vscode.window.createWebviewPanel(
    'nativeCraftResult',
    'Native Craft',
    vscode.ViewColumn.Beside,
    {}
  );
  panel.webview.html = `<!DOCTYPE html>
<html>
<body style="font-family: system-ui; padding: 16px; white-space: pre-wrap;">
${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
</body>
</html>`;
}

function getWebviewContent(nativeLang: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Native Craft Lens</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    h2 { color: #4fc3f7; }
    .placeholder { border: 1px dashed #555; padding: 16px; margin: 12px 0; border-radius: 6px; }
  </style>
</head>
<body>
  <h2>Native Craft Lens</h2>
  <p>Preferred mental model: <strong>${nativeLang}</strong></p>
  <div class="placeholder">
    Dual-view overlay and live mental-model canvas will appear here.<br>
    Select code and use the commands to start restoring the craft feeling.
  </div>
  <p>Commands:</p>
  <ul>
    <li>Native Craft: Explain Selection in Native Language</li>
    <li>Native Craft: Suggest Craft Improvements</li>
  </ul>
</body>
</html>`;
}

export function deactivate() {}
