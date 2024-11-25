module.exports = api => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:@preact/signals-react-transform',
        {
          mode: 'all',
        },
      ],
    ],
  };
};
