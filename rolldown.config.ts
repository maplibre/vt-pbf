import {defineConfig} from 'rolldown';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
    input: ['index.ts'],
    output: {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: true
    },
    onwarn: (message) => {
        console.error(message);
        throw message;
    },
    plugins: [
        typescript({
            exclude: ['rolldown.config.ts']
        })
    ],
    external: [/node_modules/]
});
