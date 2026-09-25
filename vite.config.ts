import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/cm1-cm2/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
