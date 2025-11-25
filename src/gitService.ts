import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitDiffInfo {
    branch: string;
    diff: string;
    files: string[];
    commits: string[];
}

export class GitService {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * 检查是否是 Git 仓库
     */
    async isGitRepository(): Promise<boolean> {
        try {
            await execAsync('git rev-parse --git-dir', { cwd: this.workspaceRoot });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取当前分支名
     */
    async getCurrentBranch(): Promise<string> {
        try {
            const { stdout } = await execAsync('git branch --show-current', { cwd: this.workspaceRoot });
            return stdout.trim();
        } catch (error) {
            throw new Error('无法获取当前分支');
        }
    }

    /**
     * 获取分支的提交记录（排除 merge 提交和主分支的提交）
     */
    async getBranchCommits(baseBranch: string = 'main'): Promise<string[]> {
        try {
            const currentBranch = await this.getCurrentBranch();

            // 方法1: 使用 git cherry 找出真正属于当前分支的提交
            // + 表示该提交不在上游分支
            const { stdout: cherryOutput } = await execAsync(
                `git cherry -v ${baseBranch} ${currentBranch}`,
                { cwd: this.workspaceRoot }
            );

            // 过滤出 + 开头的提交（真正属于当前分支的）
            const commits = cherryOutput
                .split('\n')
                .filter(line => line.startsWith('+ '))
                .map(line => {
                    // 格式: + commit_hash commit_message
                    // 去掉 "+ " 前缀，保留 hash 和 message
                    return line.substring(2);
                })
                .filter(line => line);

            return commits;
        } catch (error) {
            // 如果基础分支不存在，尝试使用 master
            try {
                const currentBranch = await this.getCurrentBranch();
                const { stdout: cherryOutput } = await execAsync(
                    `git cherry -v master ${currentBranch}`,
                    { cwd: this.workspaceRoot }
                );

                const commits = cherryOutput
                    .split('\n')
                    .filter(line => line.startsWith('+ '))
                    .map(line => line.substring(2))
                    .filter(line => line);

                return commits;
            } catch {
                return [];
            }
        }
    }

    /**
     * 获取分支的 diff 内容
     */
    async getBranchDiff(baseBranch: string = 'main'): Promise<string> {
        try {
            const currentBranch = await this.getCurrentBranch();
            const { stdout } = await execAsync(
                `git diff ${baseBranch}...${currentBranch}`,
                { cwd: this.workspaceRoot, maxBuffer: 1024 * 1024 * 10 }
            );
            return stdout;
        } catch (error) {
            // 尝试 master 分支
            try {
                const currentBranch = await this.getCurrentBranch();
                const { stdout } = await execAsync(
                    `git diff master...${currentBranch}`,
                    { cwd: this.workspaceRoot, maxBuffer: 1024 * 1024 * 10 }
                );
                return stdout;
            } catch {
                // 如果都失败了，返回未暂存的更改
                const { stdout } = await execAsync(
                    'git diff HEAD',
                    { cwd: this.workspaceRoot, maxBuffer: 1024 * 1024 * 10 }
                );
                return stdout;
            }
        }
    }

    /**
     * 获取修改的文件列表
     */
    async getChangedFiles(baseBranch: string = 'main'): Promise<string[]> {
        try {
            const currentBranch = await this.getCurrentBranch();
            const { stdout } = await execAsync(
                `git diff ${baseBranch}...${currentBranch} --name-only`,
                { cwd: this.workspaceRoot }
            );
            return stdout.trim().split('\n').filter(line => line);
        } catch (error) {
            try {
                const currentBranch = await this.getCurrentBranch();
                const { stdout } = await execAsync(
                    `git diff master...${currentBranch} --name-only`,
                    { cwd: this.workspaceRoot }
                );
                return stdout.trim().split('\n').filter(line => line);
            } catch {
                const { stdout } = await execAsync(
                    'git diff HEAD --name-only',
                    { cwd: this.workspaceRoot }
                );
                return stdout.trim().split('\n').filter(line => line);
            }
        }
    }

    /**
     * 获取完整的 Git 差异信息
     */
    async getGitDiffInfo(baseBranch?: string): Promise<GitDiffInfo> {
        const isGit = await this.isGitRepository();
        if (!isGit) {
            throw new Error('当前目录不是 Git 仓库');
        }

        const branch = await this.getCurrentBranch();
        const base = baseBranch || 'main';
        const diff = await this.getBranchDiff(base);
        const files = await this.getChangedFiles(base);
        const commits = await this.getBranchCommits(base);

        return { branch, diff, files, commits };
    }
}
