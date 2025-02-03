/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^app/(.*)$": "<rootDir>/app/$1",
    "^@/(.*)$": "<rootDir>/app/$1",
    "^assets/(.*)$": "<rootDir>/assets/$1"
  }
}
