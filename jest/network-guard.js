/*
 * FIX-48: a test never reaches a real server.
 *
 * `src/api/env.ts` falls back to the production Hub, and the API client keeps the `fetch` it finds
 * when it is created, so a test that mocks neither the env nor fetch early enough could send a
 * real request from jest. This guard sits under every mock: it wraps the globals a request leaves
 * through (fetch, XMLHttpRequest, WebSocket) and refuses any host that is not this machine.
 *
 * A request to a refused host does two things:
 *   1. it throws (fetch rejects) with an error that names the host, and
 *   2. it is written to a list the setup file checks after each test, so a test whose code catches
 *      the error (the API client turns it into a "no connection" answer) still fails.
 *
 * A test that mocks `fetch` (or `XMLHttpRequest`, or `WebSocket`) replaces the guarded global with
 * its own, so the guard never sees that test's requests. Only a request that would really leave
 * the machine is stopped.
 */
const { URL } = require('node:url');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
/** Addresses that open no connection, so they carry no host to check. */
const OFFLINE_PROTOCOLS = new Set(['file:', 'data:', 'blob:', 'about:']);
const GUARDED = Symbol.for('wawu.jest.networkGuard.wrapped');
const STATE = Symbol.for('wawu.jest.networkGuard.state');

class NetworkGuardError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkGuardError';
  }
}

/** Only this machine is reachable from a test. */
function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(String(hostname).toLowerCase().replace(/^\[|\]$/g, ''));
}

/** The parsed address of a request, or null when it has no host to check (relative, data:, file:). */
function parseTarget(input) {
  let raw = input;
  if (raw !== null && typeof raw === 'object') {
    raw = typeof raw.url === 'string' ? raw.url : typeof raw.href === 'string' ? raw.href : String(raw);
  }
  let url;
  try {
    url = new URL(String(raw));
  } catch {
    return null;
  }
  if (OFFLINE_PROTOCOLS.has(url.protocol) || !url.hostname) return null;
  return url;
}

function stateOf(target) {
  if (!target[STATE]) {
    Object.defineProperty(target, STATE, { value: { violations: [] }, enumerable: false });
  }
  return target[STATE];
}

/** Throws a NetworkGuardError, and records it, when `input` points at a host that is not this machine. */
function assertLocal(target, via, input) {
  const url = parseTarget(input);
  if (!url || isLocalHost(url.hostname)) return;
  const error = new NetworkGuardError(
    `Blocked a real network request from a test: ${via} to host "${url.hostname}" (${url.protocol}//${url.host}${url.pathname}). ` +
      'Tests may only reach localhost or 127.0.0.1. Mock fetch, XMLHttpRequest or WebSocket in the test, ' +
      'or mock "@/api/env", before the request is made.',
  );
  stateOf(target).violations.push({ via, host: url.hostname, message: error.message });
  throw error;
}

function guardFetch(target) {
  const original = target.fetch;
  if (typeof original !== 'function' || original[GUARDED]) return;
  const guarded = function fetch(input, init) {
    try {
      assertLocal(target, 'fetch', input);
    } catch (error) {
      return Promise.reject(error);
    }
    return original.call(this, input, init);
  };
  Object.defineProperty(guarded, GUARDED, { value: true });
  target.fetch = guarded;
}

function guardXhr(target) {
  const Xhr = target.XMLHttpRequest;
  if (typeof Xhr !== 'function' || !Xhr.prototype || typeof Xhr.prototype.open !== 'function') return;
  const original = Xhr.prototype.open;
  if (original[GUARDED]) return;
  const guarded = function open(method, url, ...rest) {
    assertLocal(target, 'XMLHttpRequest', url);
    return original.call(this, method, url, ...rest);
  };
  Object.defineProperty(guarded, GUARDED, { value: true });
  Xhr.prototype.open = guarded;
}

function guardWebSocket(target) {
  const Original = target.WebSocket;
  if (typeof Original !== 'function' || Original[GUARDED]) return;
  const guarded = new Proxy(Original, {
    construct(Class, args, newTarget) {
      assertLocal(target, 'WebSocket', args[0]);
      return Reflect.construct(Class, args, newTarget);
    },
    get(Class, key, receiver) {
      return key === GUARDED ? true : Reflect.get(Class, key, receiver);
    },
  });
  target.WebSocket = guarded;
}

/** Wraps the request globals of `target` (the test's global). Safe to call twice. */
function installNetworkGuard(target) {
  stateOf(target);
  guardFetch(target);
  guardXhr(target);
  guardWebSocket(target);
}

/** The refused requests since the last call; the list is emptied. */
function takeViolations(target) {
  const state = stateOf(target);
  return state.violations.splice(0, state.violations.length);
}

module.exports = { NetworkGuardError, assertLocal, installNetworkGuard, isLocalHost, parseTarget, takeViolations };
