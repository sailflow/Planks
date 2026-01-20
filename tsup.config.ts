import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'next/link', 'next/navigation', 'zod', '@hookform/resolvers'],
    // Include CSS
    injectStyle: false,
    // Generate styles.css
    esbuildOptions(options) {
        options.banner = {
            js: '"use client";',
        };
    },
});
