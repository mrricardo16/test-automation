import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const frontendRoot = join(root, 'frontend');
const seedPath = join(root, 'data', 'seed.json');
const expectationPath = join(root, 'data', 'acceptance-expectations.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
const expectations = JSON.parse(readFileSync(expectationPath, 'utf8'));
const host = readArgument('--host', '127.0.0.1');
const requestedPort = Number.parseInt(readArgument('--port', '0'), 10);

const users = {
  admin: { role: 'admin' },
  viewer: { role: 'viewer' },
};
const tokens = new Map([
  ['synthetic-token-admin', { username: 'admin', role: 'admin' }],
  ['synthetic-token-viewer', { username: 'viewer', role: 'viewer' }],
]);

let state = createState();

function readArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function createState() {
  return {
    items: seed.items.map((item) => ({ ...item })),
    features: { ...seed.features },
    nextItemNumber: 2,
  };
}

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  });
  response.end(payload);
}

function sendText(response, status, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  response.end(body);
}

function authUser(request) {
  const header = request.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  return tokens.get(header.slice('Bearer '.length)) ?? null;
}

function requireUser(request, response) {
  const user = authUser(request);
  if (!user) {
    sendJson(response, 401, { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return null;
  }
  return user;
}

function requireAdmin(request, response) {
  const user = requireUser(request, response);
  if (!user) return null;
  if (user.role !== 'admin') {
    sendJson(response, 403, { error: { code: 'FORBIDDEN', message: 'Admin permission required.' } });
    return null;
  }
  return user;
}

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) reject(new Error('BODY_TOO_LARGE'));
    });
    request.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    request.on('error', reject);
  });
}

function validateItem(body) {
  if (typeof body?.name !== 'string' || body.name.trim() === '') {
    return 'name is required.';
  }
  if (body.name.length > 50) return 'name must be 50 characters or fewer.';
  return null;
}

function findItem(id) {
  return state.items.find((item) => item.id === id);
}

function sendStatic(response, pathname) {
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!['index.html', 'app.mjs'].includes(file)) {
    sendText(response, 404, 'Not Found');
    return;
  }
  const contentType = file.endsWith('.mjs') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
  sendText(response, 200, readFileSync(join(frontendRoot, file), 'utf8'), contentType);
}

async function handle(request, response) {
  const url = new URL(request.url ?? '/', `http://${host}`);
  const pathname = url.pathname;
  const method = request.method ?? 'GET';

  if (method === 'GET' && pathname === '/health') {
    sendJson(response, 200, { status: 'ok', runtime: 'synthetic-product', pid: process.pid });
    return;
  }

  if (method === 'POST' && pathname === '/__control/reset') {
    if (request.headers['x-synthetic-control'] !== 'reset-only') {
      sendJson(response, 403, { error: { code: 'CONTROL_HEADER_REQUIRED', message: 'Synthetic control header required.' } });
      return;
    }
    state = createState();
    sendJson(response, 200, { reset: true, seed: 'seed-v1', itemCount: state.items.length });
    return;
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseJsonBody(request);
    if (!users[body.username] || body.password !== 'test-only-password') {
      sendJson(response, 401, { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid test credentials.' } });
      return;
    }
    sendJson(response, 200, {
      token: `synthetic-token-${body.username}`,
      user: { username: body.username, role: users[body.username].role },
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/items') {
    if (!requireUser(request, response)) return;
    sendJson(response, 200, { items: state.items.map((item) => ({ ...item })) });
    return;
  }

  if (method === 'POST' && pathname === '/api/items') {
    if (!requireAdmin(request, response)) return;
    const body = await parseJsonBody(request);
    const validationError = validateItem(body);
    if (validationError) {
      sendJson(response, 400, { error: { code: 'VALIDATION_ERROR', message: validationError } });
      return;
    }
    const item = { id: `item-${String(state.nextItemNumber++).padStart(3, '0')}`, name: body.name, status: 'draft' };
    state.items.push(item);
    sendJson(response, 201, { item });
    return;
  }

  const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (itemMatch && method === 'PATCH') {
    if (!requireAdmin(request, response)) return;
    const item = findItem(itemMatch[1]);
    if (!item) {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Item not found.' } });
      return;
    }
    const body = await parseJsonBody(request);
    if (body.name !== undefined) {
      const validationError = validateItem({ name: body.name });
      if (validationError) {
        sendJson(response, 400, { error: { code: 'VALIDATION_ERROR', message: validationError } });
        return;
      }
      item.name = body.name;
    }
    sendJson(response, 200, { item: { ...item } });
    return;
  }

  if (itemMatch && method === 'DELETE') {
    if (!requireAdmin(request, response)) return;
    const index = state.items.findIndex((item) => item.id === itemMatch[1]);
    if (index < 0) {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Item not found.' } });
      return;
    }
    state.items.splice(index, 1);
    response.writeHead(204);
    response.end();
    return;
  }

  const stateMatch = pathname.match(/^\/api\/items\/([^/]+)\/state$/);
  if (stateMatch && method === 'PATCH') {
    if (!requireAdmin(request, response)) return;
    const item = findItem(stateMatch[1]);
    if (!item) {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Item not found.' } });
      return;
    }
    const body = await parseJsonBody(request);
    const allowed = (item.status === 'draft' && body.status === 'submitted') ||
      (item.status === 'submitted' && body.status === 'approved');
    if (!allowed) {
      sendJson(response, 409, { error: { code: 'INVALID_STATE_TRANSITION', message: 'State transition is not allowed.' } });
      return;
    }
    item.status = body.status;
    sendJson(response, 200, { item: { ...item } });
    return;
  }

  if (method === 'GET' && pathname === '/api/feature-flags') {
    sendJson(response, 200, { ...state.features });
    return;
  }

  if (method === 'GET' && pathname === '/api/feature-flags/new-dashboard/preview') {
    if (!state.features.newDashboard) {
      sendJson(response, 403, { error: { code: 'FEATURE_DISABLED', message: 'Feature flag is disabled.' } });
      return;
    }
    sendJson(response, 200, { enabled: true });
    return;
  }

  if (method === 'GET' && pathname === '/api/faults/500') {
    sendJson(response, 500, { error: { code: 'SYNTHETIC_CONTROLLED_ERROR', message: 'Controlled synthetic server error.' } });
    return;
  }

  if (method === 'GET' && pathname === '/api/bugs/known') {
    sendJson(response, 200, {
      knownBug: true,
      bugId: seed.knownBug.bugId,
      expectation: 'EXPECT_PRODUCT_FAIL',
      expected: seed.knownBug.expected,
      actual: seed.knownBug.actual,
      acceptanceExpectation: expectations.scenarios.find((scenario) => scenario.id === 'SYN-KNOWN-BUG')?.expectation,
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/manual-only') {
    sendJson(response, 200, {
      automationStatus: 'MANUAL',
      reason: 'Canvas visual fidelity and OS-level interaction require manual review.',
    });
    return;
  }

  if (method === 'GET' && (pathname === '/' || pathname === '/manual-only' || pathname === '/app.mjs')) {
    sendStatic(response, pathname === '/manual-only' ? '/' : pathname);
    return;
  }

  sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Synthetic route not found.' } });
}

const server = createServer((request, response) => {
  handle(request, response).catch((error) => {
    const code = error?.message === 'INVALID_JSON' ? 'INVALID_JSON' : 'SYNTHETIC_HANDLER_ERROR';
    sendJson(response, 400, { error: { code, message: 'Synthetic request could not be processed.' } });
  });
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(requestedPort, host, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : requestedPort;
  process.stdout.write(`SYNTHETIC_RUNTIME_READY ${JSON.stringify({ host, port, pid: process.pid })}\n`);
});
