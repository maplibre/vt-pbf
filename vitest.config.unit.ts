import {defineConfig} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    test: {
        name: 'unit',
        include: [
            'test/**/*.{ts,js}'
        ]
    },
    plugins: [tsconfigPaths()]
});
