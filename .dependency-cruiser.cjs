/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* 规则 1：禁止循环依赖 */
    {
      name: 'no-circular',
      severity: 'error',
      comment: '禁止循环依赖，以免引起初始化和加载时序问题。',
      from: {},
      to: { circular: true },
    },
    /* 规则 2：核心逻辑（core）禁止依赖 UI 层 */
    {
      name: 'core-not-to-ui',
      severity: 'error',
      comment: '核心逻辑 src/core 应该是纯粹的数据与算法，禁止引用 UI 模块。',
      from: { path: '^src/core' },
      to: { path: '^src/ui' },
    },
    /* 规则 3：核心逻辑（core）禁止依赖流程控制层 */
    {
      name: 'core-not-to-flow',
      severity: 'error',
      comment: '核心逻辑 src/core 禁止引用状态流程控制 src/flow 模块。',
      from: { path: '^src/core' },
      to: { path: '^src/flow' },
    },
  ],
  options: {
    doNotFollow: 'node_modules',
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
