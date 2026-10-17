/* global jest, afterEach, afterAll */
/*
 * FIX-48: the part of the test setup that keeps jest off real servers. It runs after the test
 * framework is installed (jest config `setupFilesAfterEnv`), before the test file's own imports.
 *
 *  1. '@/api/env' is a closed local port (the discard port, nothing listens there). Both the Hub
 *     and WAWU ID are unreachable by default, so a test that forgets to mock its network cannot
 *     reach production. The two addresses differ (127.0.0.1 and localhost) and neither starts with
 *     the other, so a test can still tell a call to the Hub from a call to WAWU ID by its address
 *     (auth-signup.test.tsx does). A test that needs its own address mocks '@/api/env' itself and wins over this.
 *  2. fetch, XMLHttpRequest and WebSocket refuse any host that is not localhost or 127.0.0.1
 *     (jest/network-guard.js). A test that mocks one of them replaces the guarded global.
 *  3. A refused request fails the test even when the code under test caught the error.
 */
const { installNetworkGuard, takeViolations } = require('./jest/network-guard');

// A relative path, so it is the same module whether a file imports it as '@/api/env' or './env'.
jest.mock('./src/api/env', () => ({
  apiBaseUrl: 'http://127.0.0.1:9',
  identityBaseUrl: 'http://localhost:9',
}));

installNetworkGuard(globalThis);

function failOnViolations() {
  const violations = takeViolations(globalThis);
  if (violations.length === 0) return;
  const lines = violations.map((violation) => `  - ${violation.message}`).join('\n');
  throw new Error(`This test sent ${violations.length} request(s) toward a real host:\n${lines}`);
}

afterEach(failOnViolations);
afterAll(failOnViolations);
