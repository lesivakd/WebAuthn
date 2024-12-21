

export default {
    entry: {
        main: "./src/browser/main/index.js",
        auth: "./src/browser/auth/index.js",
        reg: "./src/browser/reg/index.js"
    },
    mode: 'development',
    resolve: {
        extensions: ['.js'],
    },
    output: {
        filename: '[name].js',
        path: '/Users/LAnna/IdeaProjects/WebAuthn_/public/sources',
    },
};