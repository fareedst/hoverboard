module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'commonjs'
      }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-transform-modules-commonjs'
  ]
}; 