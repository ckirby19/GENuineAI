module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0066cc',
          dark: '#004c99',
        },
      },
    },
  },
  plugins: [],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off'
  }
};