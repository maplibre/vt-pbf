import {defineConfig} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    test: {
        name: 'unit',
        include: [
            'test/**/*.{ts,js}'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['json', 'html'],
            exclude: ['node_modules/', 'bench/', 'dist/', 'test/'],
            all: true,
            include: ['index.ts', 'lib/**/*.ts'],
            reportsDirectory: './coverage/vitest/unit',
        }
    },
    plugins: [tsconfigPaths()]
});
