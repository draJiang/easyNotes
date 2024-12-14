module.exports = {
    plugins: [
      require('postcss-preset-env')({
        // 选项
        autoprefixer: {
          flexbox: 'no-2009'
        },
        stage: 3
      })
    ]
  };
  