import { defineConfig } from 'tsup';

export default defineConfig([
    // Main library build
    {
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
    },
    // MCP server build
    {
        entry: ['src/mcp/server.ts'],
        format: ['esm'],
        dts: false,
        sourcemap: true,
        outDir: 'dist/mcp',
        platform: 'node',
        target: 'node18',
        external: ['@modelcontextprotocol/sdk'],
    },
]);
