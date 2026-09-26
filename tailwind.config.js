import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Le papier du cahier, et l'encre bleu nuit du stylo-plume.
        papier: '#FBF7EE',
        encre: {
          DEFAULT: '#1E2A4A',
          douce: '#475272',
          pale: '#646D88',
        },
        seyes: '#C9DDF2',
      },
      fontFamily: {
        // Andika : dessinée pour les lecteurs débutants, chaque lettre s'y
        // distingue (I, l, 1). Playwrite France : l'écriture cursive de
        // l'école française, pour le titre seulement.
        sans: ['Andika', ...defaultTheme.fontFamily.sans],
        cursive: ['"Playwrite FR Moderne"', 'cursive'],
      },
    },
  },
  plugins: [],
};
