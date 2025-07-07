import {type RollupOptions} from 'rollup';
import strip from '@rollup/plugin-strip';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const config: RollupOptions = {
    input: ['index.ts'],
    output: [
        {
            file: pkg.main,
            format: 'es',
            sourcemap: true
        }
    ],
    onwarn: (message) => {
        console.error(message);
        throw message;
    },
    plugins: [
        strip({
            sourceMap: true
        }),
        terser({
            compress: {
                pure_getters: true,
                passes: 3
            },
            sourceMap: true
        }),
        typescript()
    ],
    external: [
		...Object.keys(pkg.dependencies || {})
	],
};

export default config;
