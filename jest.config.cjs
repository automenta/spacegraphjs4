module.exports = {
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup.js'],
    globalSetup: './tests/setup/globalSetup.js',
    globalTeardown: './tests/setup/globalTeardown.js',
    testTimeout: 60000, // 60 seconds
};