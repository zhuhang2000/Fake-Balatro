module.exports = {
  // 对改动的 JS/TS 文件进行格式化、语法修复和类型检查
  'src/**/*.{js,ts}': [
    'biome check --write --no-errors-on-unmatched',
    () => 'tsc --noEmit', // 类型检查需要全量上下文，因此用函数形式运行
  ],
  // 仅格式化其他非 JS/TS 文件
  '*.{json,css,html,md}': ['biome format --write --no-errors-on-unmatched'],
};
