/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: {
                    module: "ESNext",
                    moduleResolution: "bundler",
                },
            },
        ],
    },
    testMatch: ["**/src/tests/**/*.test.ts"],
    testTimeout: 30000,
    setupFiles: ["./src/tests/helpers/setup.ts"],   
};