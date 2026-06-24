import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.js'],
  format: ['esm'],
  clean: true,
  dts: false, // Disabled declaration files to prevent Out-Of-Memory errors during compilation on Render
  bundle: false,
});
