export default {
  extends: ['stylelint-config-standard-scss'],

  plugins: ['stylelint-declaration-strict-value'],

  rules: {
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'background',
        'fill',
        'stroke',
        '/^margin/',
        '/^padding/',
        'gap',
        'row-gap',
        'column-gap',
        'width',
        'height',
        'font-size',
        'font-family',
        'font-weight',
        'border-radius',
        'box-shadow',
      ],
      {
        ignoreValues: [
          '0',
          'auto',
          'none',
          'inherit',
          'initial',
          'unset',
          'transparent',
          'currentColor',
        ],
      },
    ],
  },

  overrides: [
    {
      files: ['**/_tokens.scss'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
      },
    },
    {
      files: ['src/style.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
};
