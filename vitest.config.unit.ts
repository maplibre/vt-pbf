import {defineConfig} from 'vitest/config';

export default defineConfig({
    resolve: {
        tsconfigPaths: true
    },
    test: {
        name: 'unit',
        include: [
            'test/**/*.{ts,js}'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['json', 'html'],
            exclude: ['node_modules/', 'bench/', 'dist/', 'test/'],
            include: ['index.ts', 'lib/**/*.ts'],
            reportsDirectory: './coverage/vitest/unit',
        }
    }
});
