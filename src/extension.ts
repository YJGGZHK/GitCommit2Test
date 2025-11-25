import * as vscode from 'vscode';
import { TestCaseViewProvider } from './webviewProvider';
import { GitService } from './gitService';
import { AIService } from './aiService';

export function activate(context: vscode.ExtensionContext) {
    // 获取工作区根目录
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showWarningMessage('请先打开一个工作区');
        return;
    }

    // 注册 WebView Provider
    const provider = new TestCaseViewProvider(context.extensionUri, workspaceRoot);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            TestCaseViewProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // 注册生成测试用例命令
    const generateCommand = vscode.commands.registerCommand(
        'gitCommit2Test.generateTestCase',
        async () => {
            const gitService = new GitService(workspaceRoot);
            const aiService = new AIService();

            try {
                // 检查是否是 Git 仓库
                const isGit = await gitService.isGitRepository();
                if (!isGit) {
                    vscode.window.showErrorMessage('当前工作区不是 Git 仓库');
                    return;
                }

                // 询问基准分支
                const baseBranch = await vscode.window.showInputBox({
                    prompt: '请输入基准分支名称（默认: main）',
                    placeHolder: 'main',
                    value: 'main'
                });

                // 获取 Git 差异信息
                vscode.window.showInformationMessage('正在分析代码变更...');
                const diffInfo = await gitService.getGitDiffInfo(baseBranch);

                if (!diffInfo.diff || diffInfo.diff.trim().length === 0) {
                    vscode.window.showWarningMessage('当前分支没有代码变更');
                    return;
                }

                // 生成测试用例
                vscode.window.showInformationMessage('正在生成测试用例，请稍候...');
                const result = await aiService.generateTestCases(
                    diffInfo.diff,
                    diffInfo.commits
                );

                // 在新文档中显示结果
                const doc = await vscode.workspace.openTextDocument({
                    content: result.rawText,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage('测试用例生成成功！');
            } catch (error: any) {
                vscode.window.showErrorMessage(`生成失败: ${error.message}`);
            }
        }
    );

    // 注册打开设置命令
    const settingsCommand = vscode.commands.registerCommand(
        'gitCommit2Test.openSettings',
        () => {
            // 打开设置页面，直接搜索配置前缀
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'gitCommit2Test'
            );
        }
    );

    context.subscriptions.push(generateCommand, settingsCommand);

    // 检查配置
    checkConfiguration();
}

function checkConfiguration() {
    const config = vscode.workspace.getConfiguration('gitCommit2Test');
    const apiKey = config.get<string>('apiKey', '');

    if (!apiKey) {
        vscode.window.showWarningMessage(
            'GitCommit2Test: 请先配置 AI API 密钥',
            '去配置'
        ).then(selection => {
            if (selection === '去配置') {
                vscode.commands.executeCommand('gitCommit2Test.openSettings');
            }
        });
    }
}

export function deactivate() {}
