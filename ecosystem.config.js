// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'twitter',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'development', // Riêng NODE_ENV thì có thể dùng được process.env.NODE_ENV hoặc process.NODE_ENV, còn lại thì phải sử dụng
        // process.env.TEN_BIEN
        TEN_BIEN: 'Gia tri',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
