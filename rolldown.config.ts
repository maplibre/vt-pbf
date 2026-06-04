import {defineConfig} from 'rolldown';

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
    external: ['pbf', '@mapbox/point-geometry']
});
