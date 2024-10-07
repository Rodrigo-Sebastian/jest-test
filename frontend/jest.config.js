// frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './', // Basen för Next.js-applikationen
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Justera till <rootDir>/frontend/jest.setup.js om filen ligger i frontend-mappen
    testEnvironment: 'jest-environment-jsdom', // Uppdatera till 'jest-environment-jsdom'
    moduleNameMapper: {
        '^.+\\.(css|scss|sass)$': 'identity-obj-proxy', // Mappa CSS-moduler
  },
};

module.exports = createJestConfig(customJestConfig);
