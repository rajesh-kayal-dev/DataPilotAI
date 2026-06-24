import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.js'],
  format: ['esm'],
  clean: true,
  dts: true,
  bundle: false,
});
