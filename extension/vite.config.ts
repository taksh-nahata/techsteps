import { defineConfig } from 'vite';
import { resolve } from 'path';

// Hand-rolled instead of @crxjs/vite-plugin: that plugin's stable line
// targets Vite 4 and Vite 5 support has historically been beta/flaky. This
// extension is small enough (one service worker, on-demand injection, no
// content-script HMR need) that a plain multi-entry build + a short
// postbuild copy step (scripts/postbuild.mjs) is less toolchain risk.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
  },
});
