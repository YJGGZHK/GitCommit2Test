# GitCommit2Test - Git 提交测试用例生成器

一个强大的 VSCode 插件，使用 AI 自动分析 Git 分支的代码变更，生成详细的测试用例。

## 功能特性

✨ **智能分析**: 自动读取当前分支相对于基准分支（如 main/master）的所有代码变更

🤖 **AI 驱动**: 集成 OpenAI GPT、Anthropic Claude 等 AI 服务，智能生成测试用例

📋 **格式化输出**: 生成结构化的测试用例，包含需求描述、测试分类、操作步骤和预期结果

🎨 **侧边栏面板**: 固定在侧边栏的美观界面，方便查看和操作

⚙️ **灵活配置**: 支持多种 AI 提供商，可自定义 API 端点和提示词

📝 **一键复制**: 快速复制生成的测试用例到剪贴板

## 安装

### 从 VSIX 文件安装（推荐）

1. 下载最新的 `.vsix` 安装包文件
2. 在 VSCode 中打开扩展面板（`Cmd/Ctrl + Shift + X`）
3. 点击右上角的 `...` 菜单
4. 选择 "从 VSIX 安装..."
5. 选择下载的 `.vsix` 文件

### 从扩展市场安装

1. 在 VSCode 扩展市场搜索 "GitCommit2Test"
2. 点击安装

### 从源码安装

```bash
cd GitCommit2Test
npm install
npm run compile
# 在 VSCode 中按 F5 运行调试
```

### 生成安装包

如果你想自己打包扩展：

```bash
# 安装依赖
npm install

# 编译代码
npm run compile

# 生成 VSIX 安装包
npm run package
```

生成的 `.vsix` 文件将保存在项目根目录下。

## 配置

首次使用需要配置 AI API：

1. 打开 VSCode 设置 (`Cmd/Ctrl + ,`)
2. 搜索 "GitCommit2Test"
3. 配置以下项目：

### 必需配置

- **AI Provider** (`gitCommit2Test.aiProvider`): 选择 AI 服务提供商
  - `openai` - OpenAI GPT
  - `anthropic` - Anthropic Claude
  - `custom` - 自定义 API

- **API Key** (`gitCommit2Test.apiKey`): 你的 AI API 密钥

### 可选配置

- **Model** (`gitCommit2Test.model`): 使用的模型名称
  - OpenAI: `gpt-4`, `gpt-3.5-turbo`
  - Anthropic: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`

- **API Endpoint** (`gitCommit2Test.apiEndpoint`): 自定义 API 端点（可选）
  - 默认 OpenAI: `https://api.openai.com/v1/chat/completions`
  - 默认 Anthropic: `https://api.anthropic.com/v1/messages`

- **System Prompt** (`gitCommit2Test.systemPrompt`): 自定义系统提示词

### 配置示例

#### OpenAI 配置
```json
{
  "gitCommit2Test.aiProvider": "openai",
  "gitCommit2Test.apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "gitCommit2Test.model": "gpt-4"
}
```

#### Anthropic Claude 配置
```json
{
  "gitCommit2Test.aiProvider": "anthropic",
  "gitCommit2Test.apiKey": "sk-ant-xxxxxxxxxxxxxxxxxxxxx",
  "gitCommit2Test.model": "claude-3-opus-20240229"
}
```

#### 自定义 API 配置
```json
{
  "gitCommit2Test.aiProvider": "custom",
  "gitCommit2Test.apiKey": "your-api-key",
  "gitCommit2Test.apiEndpoint": "https://your-api-endpoint.com/v1/chat/completions",
  "gitCommit2Test.model": "your-model"
}
```

## 使用方法

### 方法一：使用侧边栏面板（推荐）

1. 点击左侧活动栏的 "Git提交测试用例" 图标
2. 在输入框中填写基准分支名称（可选，默认为 main）
3. 点击 "生成测试用例" 按钮
4. 等待 AI 分析并生成测试用例
5. 查看生成的测试用例，可点击 "复制全部测试用例" 复制到剪贴板

### 方法二：使用命令面板

1. 按 `Cmd/Ctrl + Shift + P` 打开命令面板
2. 输入 "生成测试用例"
3. 选择基准分支
4. 生成的测试用例会在新标签页中以 Markdown 格式显示

## 输出格式示例

```
需求
授权信息删除功能,支持查看待删除授权信息和已删除记录,仅高级管理员和普通管理员可删除操作。微商城店铺、零售单店、零售总部显示此功能。

测试用例

一、Tab页显示控制
用例1: 微商城店铺,进入授权管理页面,应显示"授权信息删除"Tab
* 操作: 微商城店铺登录,进入设置-授权管理
* 期望: 页面显示"授权设置"、"授权记录"(如有权限)、"授权信息删除"三个Tab

用例2: 零售单店,进入授权管理页面,应显示"授权信息删除"Tab
* 操作: 零售单店登录,进入设置-授权管理
* 期望: 页面显示"授权信息删除"Tab

二、权限控制
用例1: 高级管理员登录,应可以执行删除操作
* 操作: 高级管理员账号登录,进入授权信息删除页面,选择待删除项并执行删除
* 期望: 删除操作成功,记录移至已删除列表

用例2: 普通员工登录,删除按钮应不可见或置灰
* 操作: 普通员工账号登录,进入授权信息删除页面
* 期望: 无删除操作权限,按钮不可见或置灰
```

## 工作原理

1. **Git 分析**: 插件会执行 `git diff` 命令,获取当前分支相对于基准分支的所有代码变更
2. **提交记录**: 获取分支上的所有提交信息,帮助 AI 理解变更意图
3. **AI 处理**: 将代码变更和提交信息发送给 AI,使用预设的提示词生成测试用例
4. **结果展示**: 解析 AI 返回的内容,以结构化格式展示在侧边栏中

## 支持的 Git 操作

- ✅ 分支差异对比 (`git diff`)
- ✅ 提交历史记录 (`git log`)
- ✅ 文件变更列表
- ✅ 自动检测 Git 仓库
- ✅ 支持自定义基准分支

## 常见问题

### 1. 提示 "当前目录不是 Git 仓库"
确保你的工作区是一个有效的 Git 仓库。可以运行 `git status` 验证。

### 2. 提示 "请先配置 AI API 密钥"
在 VSCode 设置中配置 `gitCommit2Test.apiKey`。

### 3. 生成的测试用例质量不高
可以尝试：
- 使用更强大的模型（如 GPT-4 或 Claude 3 Opus）
- 自定义 `gitCommit2Test.systemPrompt` 提示词
- 确保代码变更有清晰的提交信息

### 4. API 调用失败
- 检查 API 密钥是否正确
- 确认网络连接正常
- 如果使用自定义端点,验证端点地址是否正确

## 技术栈

- TypeScript
- VSCode Extension API
- Git CLI
- Axios (HTTP 客户端)
- OpenAI / Anthropic API

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监视模式
npm run watch

# 运行调试
# 在 VSCode 中按 F5
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 更新日志

### 0.0.1
- 🎉 初始版本发布
- ✨ 支持 Git 分支代码变更分析
- 🤖 集成 OpenAI 和 Anthropic AI
- 🎨 侧边栏 WebView 界面
- ⚙️ 灵活的配置选项

## 作者

你的名字

## 反馈

如有问题或建议,请在 GitHub 上提交 Issue。
