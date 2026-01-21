import {type RollupOptions} from 'rollup';
import strip from '@rollup/plugin-strip';
import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';

const config: RollupOptions = {
    input: ['index.ts'],
    output: [
        {
            file: "dist/index.es.js",
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
        typescript({
            exclude: ['rollup.config.ts']
        }),
        nodeResolve()
    ],
    external: [/node_modules/]
};

export default config;
