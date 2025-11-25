# GitCommit2Test 安装说明

## 快速安装

### 方法 1：从 VSIX 文件安装（推荐）

1. **下载安装包**
   - 获取 `git-commit-2-test-0.0.1.vsix` 文件

2. **安装扩展**
   - 打开 VSCode
   - 按 `Cmd/Ctrl + Shift + X` 打开扩展面板
   - 点击右上角的 `...`（更多操作）按钮
   - 选择 "从 VSIX 安装..."（Install from VSIX...）
   - 选择下载的 `.vsix` 文件
   - 等待安装完成

3. **配置 API**
   - 打开 VSCode 设置（`Cmd/Ctrl + ,`）
   - 搜索 "GitCommit2Test"
   - 配置 AI Provider 和 API Key

4. **开始使用**
   - 点击左侧活动栏的 "Git提交测试用例" 图标
   - 输入基准分支名称（默认 main）
   - 点击"生成测试用例"按钮

## 配置示例

### OpenAI 配置
```json
{
  "gitCommit2Test.aiProvider": "openai",
  "gitCommit2Test.apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "gitCommit2Test.model": "gpt-4"
}
```

### Anthropic Claude 配置
```json
{
  "gitCommit2Test.aiProvider": "anthropic",
  "gitCommit2Test.apiKey": "sk-ant-xxxxxxxxxxxxxxxxxxxxx",
  "gitCommit2Test.model": "claude-3-opus-20240229"
}
```

## 使用要求

- VSCode 版本 >= 1.74.0
- Git 已安装并配置
- 有效的 AI API 密钥（OpenAI 或 Anthropic）
- 当前工作区必须是 Git 仓库

## 功能特点

✨ **智能分析** - 自动分析 Git 分支代码变更
🤖 **AI 驱动** - 使用 AI 生成专业测试用例
📋 **格式化输出** - 结构化的测试用例文档
🎨 **侧边栏面板** - 美观易用的界面
⚙️ **灵活配置** - 支持多种 AI 服务商
📝 **一键复制** - 快速复制到剪贴板

## 常见问题

### Q: 提示 "当前目录不是 Git 仓库"？
A: 确保在 Git 仓库目录中打开 VSCode，可以运行 `git status` 验证。

### Q: 提示 "请先配置 AI API 密钥"？
A: 在 VSCode 设置中配置 `gitCommit2Test.apiKey`。

### Q: 如何更新扩展？
A: 下载新版本的 `.vsix` 文件，重复安装步骤即可覆盖旧版本。

### Q: 如何卸载扩展？
A: 在扩展面板中找到 GitCommit2Test，点击卸载按钮。

## 技术支持

如有问题或建议，请提交 Issue。

## 版本信息

- 当前版本：0.0.1
- 发布日期：2025-11-25
- 支持平台：macOS / Windows / Linux
