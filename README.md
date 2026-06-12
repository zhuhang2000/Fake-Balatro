# 小丑终端 JOKER.SYS

一个零外部依赖的像素纸牌游戏原型。玩法参考“小丑牌”式的手牌结算循环：选择牌组成牌型，获得筹码和倍率，通过小丑牌、牌型训练和商店改造逐步构筑更高分数。

## 运行方式

这是一个静态前端项目，不需要安装依赖。

直接用浏览器打开：

```text
index.html
```

或在项目目录启动任意静态服务后访问首页。

## 测试

项目当前使用 Node 直接运行测试脚本：

```bash
node tests/core.test.js
node tests/structure.test.js
```

语法检查示例：

```bash
node --check src/main.js
```

## 目录结构

```text
assets/           游戏素材
docs/             设计文档
styles/           页面样式
tests/            规则测试和模块结构测试
src/
  core/           扑克牌、牌型、升级、工具函数等纯逻辑
  data/           小丑牌定义
  flow/           游戏流程模块，例如商店、出牌结算
  state/          游戏状态初始化和常量
  systems/        音效、特效、噪点等系统能力
  ui/             手牌、HUD、商店、弹窗等 DOM 渲染
  main.js         游戏流程编排和事件绑定入口
```

## 开发约定

- `src/main.js` 只做流程编排、初始化和事件绑定。
- 牌型规则、升级数值等纯逻辑放在 `src/core/`。
- 商店、出牌结算等流程放在 `src/flow/`。
- DOM 渲染放在 `src/ui/`。
- 音效、粒子、背景噪点等底层能力放在 `src/systems/`。
- 新增规则或结构调整后，优先补充 `tests/core.test.js` 或 `tests/structure.test.js`。

## 当前功能

- 标准 52 张牌牌组
- 高牌、一对、两对、三条、顺子、同花、葫芦、四条、同花顺等牌型识别
- 牌型等级和商店训练升级
- 小丑牌购买、出售和触发结算
- 小丑槽位扩容
- 出牌、弃牌、过关、失败、通关和无尽模式流程
- Web Audio 合成音效和 Canvas 粒子反馈
