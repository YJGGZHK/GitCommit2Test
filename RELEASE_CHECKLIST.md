# 发布检查清单

## 打包前检查

- [x] 代码已编译通过 (`npm run compile`)
- [x] 已安装 `@vscode/vsce` 工具
- [ ] 更新版本号（在 `package.json` 中）
- [ ] 更新 CHANGELOG（记录变更内容）
- [ ] 检查 `.vscodeignore` 配置
- [ ] 添加 LICENSE 文件（可选但推荐）
- [ ] 更新 README.md
- [ ] 添加 repository 字段到 package.json（可选）

## 生成安装包

```bash
# 1. 安装依赖
npm install

# 2. 编译代码
npm run compile

# 3. 生成 VSIX 包
npm run package
```

## 安装包信息

- **文件名**: `git-commit-2-test-0.0.1.vsix`
- **大小**: ~516 KB
- **包含文件**: 319 个文件
- **依赖项**: axios (已打包)

## 警告处理（可选优化）

### 1. Repository 字段缺失
在 `package.json` 中添加：
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/GitCommit2Test.git"
  }
}
```

### 2. 缺少 LICENSE 文件
创建 `LICENSE` 文件，推荐使用 MIT 许可证。

### 3. 优化包大小（高级）
考虑使用 webpack 打包以减小体积：
```bash
npm install --save-dev webpack webpack-cli
# 配置 webpack 并更新打包脚本
```

## 测试安装包

1. **本地测试**
   ```bash
   # 在 VSCode 中安装
   code --install-extension git-commit-2-test-0.0.1.vsix
   ```

2. **验证功能**
   - [ ] 扩展图标显示在活动栏
   - [ ] 侧边栏面板正常打开
   - [ ] AI 配置功能正常
   - [ ] 生成测试用例功能正常
   - [ ] 复制功能正常
   - [ ] 错误处理正常

3. **卸载测试**
   ```bash
   code --uninstall-extension your-publisher-name.git-commit-2-test
   ```

## 发布到 VSCode 市场（可选）

### 前置要求
1. 注册 Azure DevOps 账号
2. 创建 Personal Access Token
3. 创建 Publisher
4. 配置 publisher 名称到 package.json

### 发布命令
```bash
# 登录
vsce login your-publisher-name

# 发布
npm run publish
# 或
vsce publish
```

## 分发方式

### 方式 1：直接分发 VSIX 文件
- 适合：内部团队、测试版本
- 优点：简单快速
- 缺点：需要手动更新

### 方式 2：发布到 VSCode 市场
- 适合：公开发布、广泛使用
- 优点：自动更新、易于发现
- 缺点：需要审核、配置复杂

### 方式 3：私有扩展市场
- 适合：企业内部使用
- 优点：集中管理、自动更新
- 缺点：需要搭建基础设施

## 版本管理

遵循语义化版本规范：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修正

示例：
- `0.0.1` - 初始版本
- `0.1.0` - 添加新功能
- `0.1.1` - 修复 bug
- `1.0.0` - 正式发布

## 更新现有安装

用户可以通过以下方式更新：

1. 下载新版本 VSIX 文件
2. 使用相同方式安装（会自动覆盖旧版本）
3. 重新加载 VSCode 窗口

## 故障排查

### 打包失败
- 检查 TypeScript 编译错误
- 确认所有依赖已安装
- 查看 vsce 输出的错误信息

### 安装失败
- 检查 VSCode 版本是否满足要求
- 验证 VSIX 文件是否完整
- 查看 VSCode 开发者工具的控制台日志

### 运行错误
- 打开 VSCode 开发者工具（Help > Toggle Developer Tools）
- 查看 Console 和 Network 标签的错误信息
- 检查扩展输出面板的日志

## 后续优化建议

1. **性能优化**
   - 使用 webpack 打包减小体积
   - 延迟加载依赖
   - 优化 Git 命令执行

2. **功能增强**
   - 添加测试用例导出功能（Excel、PDF）
   - 支持多分支比较
   - 添加测试用例模板
   - 集成测试管理系统

3. **用户体验**
   - 添加使用教程
   - 提供示例项目
   - 改进错误提示
   - 添加快捷键支持

4. **文档完善**
   - 添加视频教程
   - 完善 API 文档
   - 提供最佳实践指南
   - 多语言支持

## 发布记录

### v0.0.1 (2025-11-25)
- 🎉 初始版本发布
- ✨ 基础功能实现
- 📝 文档完善
