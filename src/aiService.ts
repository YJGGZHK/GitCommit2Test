import * as vscode from 'vscode';
import axios from 'axios';

export interface TestCase {
    category: string;
    cases: {
        title: string;
        operation?: string;
        expected?: string;
    }[];
}

export interface TestCaseResult {
    requirement: string;
    testCases: TestCase[];
    rawText: string;
}

export type StreamCallback = (chunk: string, fullText: string) => void;

export class AIService {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('gitCommit2Test');
    }

    /**
     * 生成测试用例（流式输出）
     */
    async generateTestCases(
        gitDiff: string,
        commits: string[],
        onStream?: StreamCallback
    ): Promise<TestCaseResult> {
        // 刷新配置
        this.config = vscode.workspace.getConfiguration('gitCommit2Test');

        const apiKey = this.config.get<string>('apiKey', '');
        if (!apiKey) {
            throw new Error('请先配置 AI API 密钥。\n\n点击"AI 配置"按钮进行配置。');
        }

        const provider = this.config.get<string>('aiProvider', 'openai');
        const model = this.config.get<string>('model', 'gpt-4');
        const systemPrompt = this.config.get<string>('systemPrompt', '');

        console.log('AI Service configuration:', { provider, model, hasApiKey: !!apiKey });

        const userPrompt = this.buildPrompt(gitDiff, commits);

        try {
            let response: string;

            if (provider === 'openai' || provider === 'custom') {
                console.log('Calling OpenAI API with stream...');
                response = await this.callOpenAIStream(apiKey, model, systemPrompt, userPrompt, onStream);
            } else if (provider === 'anthropic') {
                console.log('Calling Anthropic API with stream...');
                response = await this.callAnthropicStream(apiKey, model, systemPrompt, userPrompt, onStream);
            } else {
                throw new Error(`不支持的 AI 提供商: ${provider}`);
            }

            console.log('AI response received, length:', response.length);
            return this.parseTestCases(response);
        } catch (error: any) {
            console.error('AI API call failed:', error);

            if (error.response) {
                // HTTP 错误
                const status = error.response.status;
                const data = error.response.data;
                console.error('API Error Response:', { status, data });

                if (status === 401) {
                    throw new Error('API 密钥无效，请检查配置。\n\n点击"AI 配置"按钮重新配置。');
                } else if (status === 429) {
                    throw new Error('API 调用频率超限，请稍后再试。');
                } else if (status === 500) {
                    throw new Error('AI 服务器错误，请稍后再试。');
                } else {
                    throw new Error(`API 调用失败 (${status}): ${data.error?.message || '未知错误'}`);
                }
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new Error('无法连接到 AI 服务，请检查网络连接和 API 端点配置。');
            } else {
                throw new Error(`AI 调用失败: ${error.message}`);
            }
        }
    }

    /**
     * 构建提示词
     */
    private buildPrompt(gitDiff: string, commits: string[]): string {
        return `
你是一个专业的测试用例生成专家。请根据以下 Git 提交信息和代码变更，生成详细的测试用例。

## 提交记录
${commits.join('\n')}

## 代码变更
\`\`\`diff
${gitDiff.substring(0, 8000)} ${gitDiff.length > 8000 ? '...(已截断)' : ''}
\`\`\`

## 输出格式要求

请严格按照以下格式输出，必须包含"需求"和"测试用例"两个部分：

### 需求
用一句话描述需求。

[请仔细分析代码变更和提交记录，总结本次代码变更的核心需求。要求：
1. 描述实现了什么功能
2. 说明适用的场景和范围
3. 如果涉及权限，说明权限要求
4. 如果是修复bug，说明修复的问题
示例：授权信息删除功能，支持查看待删除授权信息和已删除记录，仅高级管理员和普通管理员可删除操作。微商城店铺、零售单店、零售总部显示此功能。]

### 测试用例

一、[测试分类1，如：Tab页显示控制]
用例1: [具体的测试场景描述]

用例2: [具体的测试场景描述]

二、[测试分类2，如：权限控制]
用例1: [具体的测试场景描述]


## 测试用例要求
1. 覆盖正向流程、异常情况、边界条件
2. 如果涉及权限，必须包含不同角色的测试
3. 测试用例要具体、可执行
4. 测试用例需要结合代码变更和提交记录来设计

输出正常标题和测试用例，不要包含其他内容，和奇怪的格式。

请开始生成：
`;
    }

    /**
     * 调用 OpenAI API
     */
    private async callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
        const endpoint = this.config.get<string>('apiEndpoint', 'https://api.openai.com/v1/chat/completions');

        const response = await axios.post(
            endpoint,
            {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt || '你是一个专业的测试用例生成助手。' },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * 调用 Anthropic Claude API
     */
    private async callAnthropic(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
        const endpoint = this.config.get<string>('apiEndpoint', 'https://api.anthropic.com/v1/messages');

        const response = await axios.post(
            endpoint,
            {
                model: model || 'claude-3-opus-20240229',
                max_tokens: 4000,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt || '你是一个专业的测试用例生成助手。'
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.content[0].text;
    }

    /**
     * 调用 OpenAI API (流式输出)
     */
    private async callOpenAIStream(
        apiKey: string,
        model: string,
        systemPrompt: string,
        userPrompt: string,
        onStream?: StreamCallback
    ): Promise<string> {
        const endpoint = this.config.get<string>('apiEndpoint', 'https://api.openai.com/v1/chat/completions');

        const response = await axios.post(
            endpoint,
            {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt || '你是一个专业的测试用例生成助手。' },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                stream: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        return new Promise((resolve, reject) => {
            let fullText = '';

            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                fullText += content;
                                if (onStream) {
                                    onStream(content, fullText);
                                }
                            }
                        } catch (error) {
                            // 忽略解析错误
                        }
                    }
                }
            });

            response.data.on('end', () => {
                resolve(fullText);
            });

            response.data.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    /**
     * 调用 Anthropic Claude API (流式输出)
     */
    private async callAnthropicStream(
        apiKey: string,
        model: string,
        systemPrompt: string,
        userPrompt: string,
        onStream?: StreamCallback
    ): Promise<string> {
        const endpoint = this.config.get<string>('apiEndpoint', 'https://api.anthropic.com/v1/messages');

        const response = await axios.post(
            endpoint,
            {
                model: model || 'claude-3-opus-20240229',
                max_tokens: 4000,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt || '你是一个专业的测试用例生成助手。',
                stream: true
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            }
        );

        return new Promise((resolve, reject) => {
            let fullText = '';

            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'content_block_delta') {
                                const content = parsed.delta?.text || '';
                                if (content) {
                                    fullText += content;
                                    if (onStream) {
                                        onStream(content, fullText);
                                    }
                                }
                            }
                        } catch (error) {
                            // 忽略解析错误
                        }
                    }
                }
            });

            response.data.on('end', () => {
                resolve(fullText);
            });

            response.data.on('error', (error: Error) => {
                reject(error);
            });
        });
    }

    /**
     * 解析测试用例
     */
    private parseTestCases(response: string): TestCaseResult {
        const lines = response.split('\n');
        let requirement = '';
        const testCases: TestCase[] = [];
        let currentCategory = '';
        let currentCases: any[] = [];
        let inRequirementSection = false;
        let inTestCaseSection = false;
        let requirementLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const originalLine = lines[i]; // 保留缩进

            // 检测需求部分开始
            if (line.match(/^#{1,3}\s*需求/) || line === '需求' || line.startsWith('**需求**')) {
                inRequirementSection = true;
                inTestCaseSection = false;
                requirementLines = [];
                continue;
            }

            // 检测测试用例部分开始
            if (line.match(/^#{1,3}\s*测试用例/) || line === '测试用例' || line.startsWith('**测试用例**')) {
                inRequirementSection = false;
                inTestCaseSection = true;
                // 保存需求
                if (requirementLines.length > 0) {
                    requirement = requirementLines
                        .map(l => l.trim())
                        .filter(l => l && !l.match(/^[#*\-]+$/)) // 过滤空行和标记行
                        .join(' ');
                }
                continue;
            }

            // 收集需求内容
            if (inRequirementSection && line) {
                // 跳过纯标记行
                if (!line.match(/^[#*\-=]+$/)) {
                    requirementLines.push(line);
                }
                continue;
            }

            // 处理测试用例部分
            if (inTestCaseSection) {
                // 提取分类（支持多种格式）
                const categoryMatch = line.match(/^([一二三四五六七八九十]+)、(.+)$/) ||
                                     line.match(/^(\d+)\.\s*(.+)$/) ||
                                     line.match(/^#{1,3}\s*(.+)$/);

                if (categoryMatch) {
                    // 保存上一个分类
                    if (currentCategory && currentCases.length > 0) {
                        testCases.push({ category: currentCategory, cases: currentCases });
                    }
                    currentCategory = categoryMatch[2] || categoryMatch[1];
                    currentCases = [];
                    continue;
                }

                // 提取用例
                const caseMatch = line.match(/^用例(\d+)[:：]\s*(.+)$/);
                if (caseMatch) {
                    const title = caseMatch[2];
                    let operation = '';
                    let expected = '';

                    // 查找操作和期望（向后查找最多10行）
                    for (let j = i + 1; j < lines.length && j < i + 10; j++) {
                        const nextLine = lines[j].trim();

                        // 遇到下一个用例就停止
                        if (nextLine.match(/^用例\d+[:：]/)) {
                            break;
                        }

                        // 遇到下一个分类就停止
                        if (nextLine.match(/^[一二三四五六七八九十]+、/) || nextLine.match(/^\d+\.\s/)) {
                            break;
                        }

                        // 提取操作
                        const opMatch = nextLine.match(/^\*\s*操作[:：]\s*(.+)$/);
                        if (opMatch) {
                            operation = opMatch[1];
                        }

                        // 提取期望
                        const expMatch = nextLine.match(/^\*\s*期望[:：]\s*(.+)$/);
                        if (expMatch) {
                            expected = expMatch[1];
                        }
                    }

                    currentCases.push({ title, operation, expected });
                }
            }
        }

        // 添加最后一个分类
        if (currentCategory && currentCases.length > 0) {
            testCases.push({ category: currentCategory, cases: currentCases });
        }

        // 如果没有解析到需求，尝试更宽松的匹配
        if (!requirement && requirementLines.length === 0) {
            const requirementMatch = response.match(/需求[：:]\s*([^\n]+)/);
            if (requirementMatch) {
                requirement = requirementMatch[1].trim();
            }
        }

        // 最后如果还是没有，从内容中智能提取
        if (!requirement) {
            // 尝试找到第一段有意义的文本（在测试用例之前）
            const beforeTestCase = response.split(/测试用例|用例\d+/)[0];
            const meaningfulLines = beforeTestCase
                .split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.match(/^[#*\-=]+$/) && !l.match(/^需求$/) && l.length > 10);

            if (meaningfulLines.length > 0) {
                requirement = meaningfulLines.slice(0, 3).join(' ').substring(0, 200);
            }
        }

        return {
            requirement: requirement || '未能从 AI 响应中提取需求描述，请查看完整文本。',
            testCases,
            rawText: response
        };
    }
}
