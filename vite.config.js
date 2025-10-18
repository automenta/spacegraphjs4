import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/SpaceGraph.js',
            name: 'SpaceGraph', // The global variable name in the UMD bundle
            fileName: (format) => `spacegraph.${format}.js`
        },
        rollupOptions: {
            // Make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['three'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    three: 'THREE'
                }
            }
        }
    }
});