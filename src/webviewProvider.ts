import * as vscode from 'vscode';
import { GitService } from './gitService';
import { AIService, TestCaseResult } from './aiService';

export class TestCaseViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'gitCommit2TestView';
    private _view?: vscode.WebviewView;
    private gitService: GitService;
    private aiService: AIService;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        workspaceRoot: string
    ) {
        this.gitService = new GitService(workspaceRoot);
        this.aiService = new AIService();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            // 禁用缓存以确保总是加载最新代码
            enableCommandUris: true
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 处理来自 webview 的消息
        webviewView.webview.onDidReceiveMessage(async (data) => {
            try {
                switch (data.type) {
                    case 'generateTestCase':
                        await this.handleGenerateTestCase(data.baseBranch);
                        break;
                    case 'openSettings':
                        // 调用命令打开设置
                        await vscode.commands.executeCommand('gitCommit2Test.openSettings');
                        break;
                    case 'copyTestCase':
                        await vscode.env.clipboard.writeText(data.content);
                        vscode.window.showInformationMessage('测试用例已复制到剪贴板');
                        break;
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`操作失败: ${error.message}`);
            }
        });
    }

    private async handleGenerateTestCase(baseBranch?: string) {
        try {
            // 显示加载状态
            this._view?.webview.postMessage({ type: 'loading', status: true });

            // 检查是否是 Git 仓库
            const isGit = await this.gitService.isGitRepository();

            if (!isGit) {
                throw new Error('当前工作区不是 Git 仓库。请确保在 Git 仓库目录中打开 VSCode。');
            }

            // 获取 Git 差异信息
            const diffInfo = await this.gitService.getGitDiffInfo(baseBranch);

            if (!diffInfo.diff || diffInfo.diff.trim().length === 0) {
                throw new Error(`当前分支 "${diffInfo.branch}" 相对于基准分支没有代码变更。\n\n请确保：\n1. 当前分支有新的提交\n2. 基准分支名称正确（默认: main）\n3. 已经提交了代码变更`);
            }

            // 发送基本信息到 webview
            this._view?.webview.postMessage({
                type: 'streamStart',
                data: {
                    branch: diffInfo.branch,
                    files: diffInfo.files,
                    commits: diffInfo.commits
                }
            });

            // 调用 AI 生成测试用例(带流式回调)
            vscode.window.showInformationMessage('✨ AI 正在生成测试用例...');

            const result = await this.aiService.generateTestCases(
                diffInfo.diff,
                diffInfo.commits,
                (chunk, fullText) => {
                    // 流式输出回调
                    this._view?.webview.postMessage({
                        type: 'streamChunk',
                        chunk: chunk,
                        fullText: fullText
                    });
                }
            );

            // 发送最终结果到 webview
            this._view?.webview.postMessage({
                type: 'streamEnd',
                data: {
                    branch: diffInfo.branch,
                    files: diffInfo.files,
                    commits: diffInfo.commits,
                    result: result
                }
            });

            vscode.window.showInformationMessage('✅ 测试用例生成完成！');
        } catch (error: any) {
            const errorMessage = error.message || '未知错误';
            vscode.window.showErrorMessage(`❌ ${errorMessage}`);
            this._view?.webview.postMessage({
                type: 'error',
                message: errorMessage
            });
        } finally {
            this._view?.webview.postMessage({ type: 'loading', status: false });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // 获取CSP源
        const cspSource = webview.cspSource;

        // 添加时间戳作为缓存破坏器
        const timestamp = Date.now();

        // 资源路径
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'webview.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'webview.css'));

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'unsafe-inline';">
    <meta name="cache-buster" content="${timestamp}">
    <title>Git提交测试用例生成器</title>
    <link href="${styleUri}" rel="stylesheet">
</head>
<body>
    <div class="header">
        <h2>Git 提交测试用例生成器</h2>
    </div>

    <div class="controls">
        <div class="input-group">
            <label for="baseBranch">基准分支 (可选，默认: main)</label>
            <input type="text" id="baseBranch" placeholder="main">
        </div>
        <div class="button-group">
            <button id="generateBtn" type="button">生成测试用例</button>
            <button id="settingsBtn" type="button" class="secondary">AI 配置</button>
        </div>
    </div>

    <div id="loading" style="display: none;" class="loading">
        <div class="spinner"></div>
        <p>正在生成测试用例...</p>
    </div>

    <div id="error" style="display: none;" class="error"></div>

    <div id="result" class="result-container" style="display: none;"></div>

    <div id="emptyState" class="empty-state">
        <p>👋 欢迎使用 Git 提交测试用例生成器</p>
        <p>点击"生成测试用例"按钮开始</p>
        <p style="font-size: 11px; margin-top: 20px;">💡 确保已配置 AI API 密钥</p>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
    }
}
