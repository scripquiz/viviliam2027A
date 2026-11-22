/**
 * esbuild plugin — suppresses the "empty-glob" warning from @stencil/core.
 *
 * In Angular + Ionic, Stencil's lazy *.entry.js loading is never used because
 * all Ionic web components are already compiled into the bundle via IonicModule.
 * Marking these phantom dynamic imports as external tells esbuild not to try
 * to resolve them as static globs, which eliminates the build warning.
 */
export default {
    name: 'suppress-stencil-entry-glob',
    setup(build) {
        build.onResolve({ filter: /\.entry\.js/ }, (args) => {
            if (args.importer?.includes('@stencil/core')) {
                return { path: args.path, external: true };
            }
        });
    },
};
