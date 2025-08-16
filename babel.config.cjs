module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime'
  ],
  env: {
    test: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }]
      ]
    }
  }
} 