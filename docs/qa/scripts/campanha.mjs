import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const qa = join(root, 'docs/qa');
const local = resolve(root, '../desafio-local/qa-20261022');
const documentationPython = join(local, 'venv-documentacao', 'Scripts', 'python.exe');
const project = 'desafio-qa-20261022';
const ordersUrl = 'http://127.0.0.1:33000';
const catalogUrl = 'http://127.0.0.1:38080';
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444'];
const missing = '99999999-9999-4999-8999-999999999999';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const areas = [
  ['01-ambiente', 'Ambiente, configuração e saúde', 'PLA01/PLA02/PLA06, Q10/Q44/Q48', 'Docker e toolchains locais; portas 33000, 38080, 35432 e 37017 livres.'],
  ['02-catalogo-consultas', 'Catálogo: listagem e detalhe', 'CAT01/CAT06, Q23', 'MongoDB de QA com os quatro produtos do seed.'],
  ['03-catalogo-lote', 'Catálogo: consulta em lote e limites HTTP', 'CAT02/CAT03/CAT05, Q24-Q26', 'Catálogo de QA saudável; IDs do seed e UUID ausente.'],
  ['04-valores-descontos', 'Dinheiro, desconto e agregado', 'ORD02, Q02-Q08', 'Build TypeScript pronto; oráculos literais em centavos.'],
  ['05-criacao-pedidos', 'Criação e validação de pedidos', 'ORD01/ORD04/ORD06, Q01/Q11-Q18/Q29/Q42', 'Duas APIs e bancos de QA; contagem SQL antes/depois de cada rejeição.'],
  ['06-leituras-historico', 'Leituras, histórico e concorrência', 'ORD03/ORD07, INT04, Q09/Q19-Q22/Q35/Q36', 'Dados sintéticos próprios; alterações de produto restauradas em finally.'],
  ['07-falhas-integracao', 'Falhas do fornecedor, SQL e recuperação', 'ORD05/ORD08, INT03/INT06, Q30-Q40/Q43/Q44', 'Somente containers/volumes do projeto de QA; stubs locais para respostas inválidas.'],
  ['08-dados-infra', 'Persistência, papéis, migrações e eficiência', 'CAT04, ORD05/ORD06, Q25/Q27/Q28/Q37-Q41/Q45', 'PostgreSQL e MongoDB de QA; usuário de administração restrito ao harness local.'],
  ['09-contratos-entrega', 'Contratos, regressão e gates de entrega', 'INT05, Q46-Q50', 'Casos anteriores resolvidos; Python com PyYAML/jsonschema; acesso externo somente se configurado.'],
];
const cases = [];
const add = (area, id, title, steps, expected, run) => cases.push({ area, id, title, steps, expected, run });
let secrets = {};
let currentEvidence = [];
let pool;
let runtimePool;
let migrationPool;
let currentId;
let commandSequence = 0;

function redact(value) {
  let text = String(value);
  for (const [key, secret] of Object.entries(secrets)) {
    if ((key.includes('PASSWORD') || key.includes('URL') || key.includes('URI')) && secret.length > 8) text = text.split(secret).join('[REDACTED]');
  }
  return text.replace(/(postgres(?:ql)?|mongodb):\/\/[^\s@]+@/g, '$1://[REDACTED]@');
}
async function command(executable, args, options = {}) {
  const started = Date.now();
  const logFile = `${currentId}-${++commandSequence}.txt`;
  const result = await new Promise((done, reject) => {
    const child = spawn(executable, args, { cwd: root, ...options, env: { ...process.env, ...options.env }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let output = '';
    child.stdout.on('data', value => { output += value; });
    child.stderr.on('data', value => { output += value; });
    child.on('error', reject);
    child.on('close', code => done({ code, output: redact(output), containsSecret: Object.entries(secrets).some(([key, value]) => key.includes('PASSWORD') && output.includes(value)), durationMs: Date.now() - started }));
    child.stdin.end(options.input);
  });
  const label = `${executable} ${args.join(' ')}`;
  await writeFile(join(qa, 'evidencias', logFile), result.output);
  currentEvidence.push({ command: redact(label), exitCode: result.code, containsSecret: result.containsSecret, durationMs: result.durationMs, log: `evidencias/${logFile}` });
  assert.equal(result.code, 0, `Comando falhou (exit ${result.code}): ${label}\n${result.output.slice(-2500)}`);
  return result.output;
}
const ps = (script, options) => command('pwsh', ['-NoProfile', '-Command', script], options);
const composeArgs = ['compose', '-p', project, '--env-file', join(local, '.env'), '-f', join(root, 'infra/compose.yaml'), '-f', join(local, 'compose.qa.yaml')];
const compose = (...args) => command('docker', [...composeArgs, ...args]);
async function mongo(code) {
  const adminUri = `mongodb://mongo_root:${encodeURIComponent(secrets.MONGO_ROOT_PASSWORD)}@127.0.0.1:27017/admin?authSource=admin`;
  const prefix = `const db = new Mongo(${JSON.stringify(adminUri)}).getDB("catalog");\nfunction qaAssert(condition){if(!condition)throw new Error("QA assertion failed");}qaAssert.eq=(expected,actual)=>{if(expected!==actual)throw new Error("QA expected "+expected+", got "+actual);};\n`;
  return command('docker', ['exec', '-i', `${project}-mongo-1`, 'mongosh', '--quiet', '--nodb', '--file', '/dev/stdin'], { input: prefix + code.replace(/\bassert(?=[.(])/g, 'qaAssert') });
}
async function api(service, path, expected, { body, raw, method, headers = {}, code } = {}) {
  const started = Date.now();
  let response;
  try {
    response = await fetch((service === 'orders' ? ordersUrl : catalogUrl) + path, {
    method: method ?? (body !== undefined || raw !== undefined ? 'POST' : 'GET'),
    headers: { ...(body !== undefined || raw !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    signal: AbortSignal.timeout(7000),
    });
  } catch (error) {
    currentEvidence.push({ service, path, expectedStatus: expected, transportError: redact(error.message), durationMs: Date.now() - started });
    throw error;
  }
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  const evidence = { service, method: method ?? (body !== undefined || raw !== undefined ? 'POST' : 'GET'), path, expectedStatus: expected, actualStatus: response.status, durationMs: Date.now() - started, headers: Object.fromEntries(['content-type', 'location', 'x-correlation-id'].map(name => [name, response.headers.get(name)])), response: json };
  currentEvidence.push(evidence);
  assert.ok((Array.isArray(expected) ? expected : [expected]).includes(response.status), `${service} ${path}: esperado ${expected}, recebido ${response.status}: ${text.slice(0, 1000)}`);
  assert.match(response.headers.get('x-correlation-id') ?? '', uuidPattern);
  if (response.status >= 400 && code) {
    assert.match(response.headers.get('content-type'), /^application\/problem\+json/);
    assert.equal(json.code, typeof code === 'string' ? code : code[response.status]);
    assert.equal(json.status, response.status);
    assert.equal(json.traceId, response.headers.get('x-correlation-id'));
    assert.ok([path.split('?')[0], decodeURI(path.split('?')[0])].includes(json.instance), 'instance deve identificar o caminho sem query');
    assert.ok(json.title && json.detail);
    assert.doesNotMatch(JSON.stringify(json), /password=|postgresql:\/\/|mongodb:\/\/|at .*\.js:\d|SELECT .* FROM /i);
  }
  return { json, response };
}
const canonical = () => ({ customer: { name: 'QA Cliente', email: 'qa@example.com' }, items: [{ productId: ids[0], quantity: 2 }, { productId: ids[1], quantity: 1 }] });
const create = (body = canonical(), options = {}) => api('orders', '/api/v1/orders', 201, { body, ...options });
function normalizeDates(value, key = '') {
  if (Array.isArray(value)) return value.map(item => normalizeDates(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, normalizeDates(item, field)]));
  return key.endsWith('At') && typeof value === 'string' ? new Date(value).toISOString() : value;
}
const sameSnapshot = (actual, expected) => assert.deepEqual(normalizeDates(actual), normalizeDates(expected));
async function countOrders() { return Number((await pool.query('SELECT count(*) AS n FROM orders')).rows[0].n); }
async function rejectOrder(body, status = 400, code = 'VALIDATION_ERROR', options = {}) {
  const before = await countOrders();
  const result = await api('orders', '/api/v1/orders', status, { body, code, ...options });
  assert.equal(await countOrders(), before, 'Rejeição gravou pedido');
  currentEvidence.push({ sql: 'count(orders) antes/depois', before, after: before });
  return result;
}
async function waitReady(service) {
  const url = (service === 'orders' ? ordersUrl : catalogUrl) + '/health/ready';
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return; } catch { /* bounded readiness */ }
    await new Promise(done => setTimeout(done, 300));
  }
  throw new Error(`${service}: readiness não recuperou`);
}

add(1, 'ENV01', 'Toolchains e versões fixadas', 'Executar node/npm/dotnet/docker/python; comparar Node e SDK com os arquivos de seleção.', 'Node 24.22.1 e SDK 10.0.402; Docker Engine e Compose acessíveis.', async () => {
  assert.match(await command('node', ['--version']), /v24\.22\.1/);
  await ps('npm --version');
  assert.match(await command('dotnet', ['--version']), /10\.0\.402/);
  await command('docker', ['version', '--format', '{{.Client.Version}} {{.Server.Version}}']);
  await command('docker', ['compose', 'version']); await command('python', ['--version']);
});
add(1, 'ENV02', 'Builds e configuração estrita de startup', 'Compilar TS; restore bloqueado e build .NET; executar testes de configuração nas duas stacks.', 'Builds aprovados; variáveis inválidas/ausentes recusadas sem valores sensíveis.', async () => {
  await ps('npm run build', { cwd: join(root, 'pedidos-typescript') });
  await command('dotnet', ['restore', 'Catalog.sln', '--locked-mode'], { cwd: join(root, 'catalogo-dotnet') });
  await command('dotnet', ['build', 'Catalog.sln', '-c', 'Release', '--no-restore'], { cwd: join(root, 'catalogo-dotnet') });
  await ps('npx vitest run test/configuration.spec.ts', { cwd: join(root, 'pedidos-typescript') });
  await command('dotnet', ['test', 'Catalog.sln', '-c', 'Release', '--no-build', '--filter', 'FullyQualifiedName~InfrastructureConfigurationTests'], { cwd: join(root, 'catalogo-dotnet') });
});
add(1, 'ENV03', 'Publicação local de QA a partir de volumes vazios', 'Validar Compose; construir imagens exclusivas; up --wait no projeto desafio-qa-20261022; consultar estado.', 'Seed/migration terminam; APIs disponíveis em loopback; composição anterior preservada.', async () => {
  await compose('config', '--quiet'); await compose('up', '-d', '--build', '--wait');
  await compose('ps', '--all'); await waitReady('catalog'); await waitReady('orders');
});
add(1, 'ENV04', 'Liveness, readiness e correlação básica', 'GET live e ready em ambas as APIs sem header, com UUID válido e com texto inválido.', '200 UP; UUID gerado, preservado ou substituído; checks postgres/mongo.', async () => {
  for (const service of ['orders', 'catalog']) {
    for (const path of ['/health/live', '/health/ready']) {
      const { json } = await api(service, path, 200); assert.equal(json.status, 'UP'); assert.equal(json.service, service);
    }
    for (const value of [randomUUID(), 'qa-invalid']) {
      const { response } = await api(service, '/health/live', 200, { headers: { 'x-correlation-id': value } });
      if (value !== 'qa-invalid') assert.equal(response.headers.get('x-correlation-id'), value);
      else assert.notEqual(response.headers.get('x-correlation-id'), value);
    }
  }
});

add(2, 'CAT01', 'Lista ativa, ordenação, páginas e vazio', 'GET lista padrão, pageSize=1 páginas 1/2 e página 1000000.', 'Somente três ativos em ordem de ID; metadados corretos; página além do fim vazia.', async () => {
  const { json } = await api('catalog', '/api/v1/products', 200);
  assert.deepEqual(json.data.map(p => p.id), ids.slice(0, 3));
  assert.deepEqual(json.meta, { page: 1, pageSize: 20, totalItems: 3, totalPages: 1 });
  for (const page of [1, 2]) {
    const result = await api('catalog', `/api/v1/products?page=${page}&pageSize=1`, 200);
    assert.equal(result.json.data[0].id, ids[page - 1]); assert.equal(result.json.meta.totalPages, 3);
  }
  assert.deepEqual((await api('catalog', '/api/v1/products?page=1000000&pageSize=100', 200)).json.data, []);
});
add(2, 'CAT02', 'Paginação inválida e sem conversão silenciosa', 'Consultar page 0,-1,1.5,abc,1000001; pageSize 0/101; parâmetro extra, repetido e objeto.', 'Todas as variações retornam 400 VALIDATION_ERROR.', async () => {
  for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=abc', 'page=1000001', 'pageSize=0', 'pageSize=101', 'other=true', 'page=1&page=2', 'page[x]=1']) await api('catalog', `/api/v1/products?${query}`, 400, { code: 'VALIDATION_ERROR' });
});
add(2, 'CAT03', 'Detalhe ativo, inativo, ausente e ID inválido', 'GET os IDs de teclado/inativo, UUID ausente e texto inválido.', '200 nos existentes, active=false no inativo; 404 PRODUCT_NOT_FOUND; 400 VALIDATION_ERROR.', async () => {
  assert.equal((await api('catalog', `/api/v1/products/${ids[0]}`, 200)).json.priceCents, 20000);
  assert.equal((await api('catalog', `/api/v1/products/${ids[3]}`, 200)).json.active, false);
  await api('catalog', `/api/v1/products/${missing}`, 404, { code: 'PRODUCT_NOT_FOUND' });
  await api('catalog', '/api/v1/products/not-a-uuid', 400, { code: 'VALIDATION_ERROR' });
});
add(2, 'CAT04', 'UUID canônico sem sufixo de controle', 'GET e lote com UUID terminado em LF; consultar UUID maiúsculo alfabético.', '400 para todo ID não canônico; não consultar nem classificar como ausência.', async () => {
  await api('catalog', `/api/v1/products/${ids[0]}%0A`, 400, { code: 'VALIDATION_ERROR' });
  await api('catalog', '/api/v1/products/query', 400, { body: { productIds: [ids[0] + '\n'] }, code: 'VALIDATION_ERROR' });
  await api('catalog', '/api/v1/products/AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', 400, { code: 'VALIDATION_ERROR' });
});
add(2, 'CAT05', 'Estado vazio sem produtos ativos', 'Desativar os três ativos somente em QA; consultar lista e detalhe; restaurar em finally.', 'Lista vazia com totalItems=0/totalPages=0; detalhe continua 200 active=false.', async () => {
  try {
    await mongo('db.products.updateMany({active:true},{$set:{active:false}});');
    const { json } = await api('catalog', '/api/v1/products', 200);
    assert.deepEqual(json, { data: [], meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
    assert.equal((await api('catalog', `/api/v1/products/${ids[0]}`, 200)).json.active, false);
  } finally { await mongo(`db.products.updateMany({_id:{$in:${JSON.stringify(ids.slice(0, 3))}}},{$set:{active:true}});`); }
});

add(3, 'BAT01', 'Lote misto, inatividade e ordem determinística', 'POST IDs invertidos: ausente, inativo, mouse e teclado.', '200; produtos encontrados ordenados, inativo explícito, ausente separado, observedAt UTC.', async () => {
  const { json } = await api('catalog', '/api/v1/products/query', 200, { body: { productIds: [missing, ids[3], ids[1], ids[0]] } });
  assert.deepEqual(json.products.map(p => p.id), [ids[0], ids[1], ids[3]]); assert.deepEqual(json.missingProductIds, [missing]);
  assert.equal(json.products[2].active, false); assert.match(json.observedAt, /(?:Z|\+00:00)$/);
});
add(3, 'BAT02', 'Lotes de 1 e 100 IDs; limite de 101', 'POST 1 ID; 100 UUIDs distintos (seed + ausentes); repetir com 101.', '200, cobertura exata dos 100 IDs; 400 com 101.', async () => {
  const hundred = [ids[0], ...Array.from({ length: 99 }, () => randomUUID())];
  for (const productIds of [[ids[0]], hundred]) {
    const { json } = await api('catalog', '/api/v1/products/query', 200, { body: { productIds } });
    assert.equal(json.products.length + json.missingProductIds.length, productIds.length);
  }
  await api('catalog', '/api/v1/products/query', 400, { body: { productIds: [...hundred, randomUUID()] }, code: 'VALIDATION_ERROR' });
});
add(3, 'BAT03', 'Forma, obrigatórios, duplicados e tentativa NoSQL', 'Enviar vazio, null, array raiz, objeto/operador no ID, campo desconhecido e IDs repetidos.', '400 para estrutura inválida; 422 DUPLICATE_PRODUCT_IDS para duplicação.', async () => {
  for (const body of [{}, { productIds: [] }, { productIds: null }, [], { productIds: [null] }, { productIds: [{ $ne: null }] }, { productIds: [ids[0]], filter: { $where: 'true' } }]) await api('catalog', '/api/v1/products/query', 400, { body });
  await api('catalog', '/api/v1/products/query', 422, { body: { productIds: [ids[0], ids[0]] }, code: 'DUPLICATE_PRODUCT_IDS' });
});
add(3, 'BAT04', 'JSON, mídia e limite do corpo', 'Enviar JSON quebrado, text/plain, corpo de 65537 bytes; repetir a mídia com barra final na rota.', '400 INVALID_JSON, 415 UNSUPPORTED_MEDIA_TYPE, 413 PAYLOAD_TOO_LARGE nas variantes roteáveis.', async () => {
  await api('catalog', '/api/v1/products/query', 400, { raw: '{bad', code: 'INVALID_JSON' });
  for (const path of ['/api/v1/products/query', '/api/v1/products/query/']) await api('catalog', path, 415, { raw: '{}', headers: { 'content-type': 'text/plain' }, code: 'UNSUPPORTED_MEDIA_TYPE' });
  await api('catalog', '/api/v1/products/query', 413, { raw: 'x'.repeat(65537), code: 'PAYLOAD_TOO_LARGE' });
});

add(4, 'MON01', 'Limiar inclusivo e arredondamento único HALF_UP', 'Calcular 49999/50000/50001 com taxa 1000; 101 a 500bps; 105 a 1000bps; reordenar linhas.', '0/5000/5000, 5, 11 centavos; soma independe de ordem.', async () => {
  const { calculateDiscount, calculateSubtotal } = await import(pathToFileURL(join(root, 'pedidos-typescript/dist/domain/money.js')));
  for (const [value, expected] of [[49999n, 0n], [50000n, 5000n], [50001n, 5000n]]) assert.equal(calculateDiscount(value, { enabled: true, thresholdCents: 50000n, rateBps: 1000 }).amountCents, expected);
  assert.equal(calculateDiscount(101n, { enabled: true, thresholdCents: 0n, rateBps: 500 }).amountCents, 5n);
  assert.equal(calculateDiscount(105n, { enabled: true, thresholdCents: 0n, rateBps: 1000 }).amountCents, 11n);
  assert.equal(calculateSubtotal([101n, 20000n]), calculateSubtotal([20000n, 101n]));
  currentEvidence.push({ oracle: '49999→0;50000→5000;50001→5000;101*5%=5;105*10%=11', result: 'assertions passed' });
});
add(4, 'MON02', 'Desativação, taxa zero/100%, limites e precisão', 'Executar suíte money com extremos de quantidade/preço/subtotal e JSON seguro.', 'Sem total negativo nem perda de precisão; entradas fora do domínio recusadas.', async () => {
  await ps('npx vitest run test/money.spec.ts', { cwd: join(root, 'pedidos-typescript') });
  const m = await import(pathToFileURL(join(root, 'pedidos-typescript/dist/domain/money.js')));
  assert.equal(m.calculateLineSubtotal(100000000n, 10000), 1000000000000n);
  assert.equal(m.calculateDiscount(1000000000000n, { enabled: true, thresholdCents: 0n, rateBps: 9999 }).amountCents, 999900000000n);
  for (const quantity of [0, -1, 10001, 1.5]) assert.throws(() => m.calculateLineSubtotal(1n, quantity));
  currentEvidence.push({ maxSubtotal: '1000000000000', rate9999Discount: '999900000000', result: 'assertions passed' });
});
add(4, 'MON03', 'Orquestração: duplicados, inelegíveis e overflow sem salvar', 'Executar testes do caso de uso com spy de Catálogo e repositório.', 'Uma consulta antes de salvar; duplicados não consultam; ausentes/inativos/overflow não persistem.', async () => {
  await ps('npx vitest run test/create-order.spec.ts', { cwd: join(root, 'pedidos-typescript') });
});

add(5, 'ORD01', 'Criação canônica, Location e snapshot SQL', 'POST 2 teclados + mouse; comparar 201 com GET e tabelas SQL.', 'Subtotal 50000, desconto 5000, total 45000; 2 linhas; snapshot completo e UTC.', async () => {
  const { json, response } = await create();
  assert.equal(json.subtotalCents, 50000); assert.equal(json.discount.amountCents, 5000); assert.equal(json.totalCents, 45000);
  assert.equal(response.headers.get('location'), `/api/v1/orders/${json.id}`);
  assert.deepEqual(json.items.map(i => i.lineNumber), [1, 2]); assert.equal(json.discount.policy.rounding, 'HALF_UP');
  assert.match(json.createdAt, /Z$/); assert.match(json.pricingObservedAt, /(?:Z|\+00:00)$/);
  sameSnapshot((await api('orders', response.headers.get('location'), 200)).json, json);
  assert.equal(Number((await pool.query('SELECT count(*) AS n FROM order_items WHERE order_id=$1', [json.id])).rows[0].n), 2);
});
add(5, 'ORD02', 'Correlação atravessa criação até Catálogo', 'Criar sem header, com texto inválido, UUID maiúsculo e UUID válido; localizar cada evento de lote no log do Catálogo.', 'O UUID devolvido por Pedidos é o mesmo registrado no Catálogo em todas as variantes.', async () => {
  for (const header of [undefined, 'invalid-qa-correlation', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', randomUUID()]) {
    const { response } = await create(canonical(), { headers: header ? { 'x-correlation-id': header } : {} });
    const correlation = response.headers.get('x-correlation-id');
    const logs = await command('docker', ['logs', '--since', '2m', `${project}-catalog-1`]);
    assert.ok(logs.includes(correlation), `Catálogo não registrou correlação devolvida ${correlation}`);
  }
});
add(5, 'ORD03', 'Cliente obrigatório, trim, Unicode e e-mail ASCII', 'Enviar campos ausentes/null/vazios, nome com controle/121 pontos, e-mails inválidos; aceitar 120 emojis e caixa preservada.', '400 e contagem SQL inalterada nas rejeições; texto válido normalizado e persistido.', async () => {
  for (const customer of [undefined, null, {}, { name: '', email: 'qa@example.com' }, { name: '   ', email: 'qa@example.com' }, { name: 'a\u0000b', email: 'qa@example.com' }, { name: '😀'.repeat(121), email: 'qa@example.com' }, { name: 'QA', email: 'inválido@example.com' }, { name: 'QA', email: 'qa' }, { name: 'QA', email: null }]) await rejectOrder({ ...canonical(), customer });
  const result = await create({ ...canonical(), customer: { name: `  ${'😀'.repeat(120)}  `, email: ' QA@Example.COM ' } });
  assert.equal([...result.json.customer.name].length, 120); assert.equal(result.json.customer.email, 'QA@Example.COM');
});
add(5, 'ORD04', 'Quantidades e cardinalidade sem coerção', 'Enviar quantidade 0,-1,10001,1.5,string,null,bool; itens vazio/null/101. Aceitar 1 e 10000; 100 IDs válidos ausentes devem chegar à regra 422.', '400 em estrutura inválida; limites válidos aceitos; nenhum registro nas rejeições.', async () => {
  for (const quantity of [0, -1, 10001, 1.5, '1', null, true]) await rejectOrder({ ...canonical(), items: [{ productId: ids[2], quantity }] });
  for (const items of [[], null, Array.from({ length: 101 }, () => ({ productId: randomUUID(), quantity: 1 }))]) await rejectOrder({ ...canonical(), items });
  for (const quantity of [1, 10000]) await create({ ...canonical(), items: [{ productId: ids[2], quantity }] });
  await rejectOrder({ ...canonical(), items: Array.from({ length: 100 }, () => ({ productId: randomUUID(), quantity: 1 })) }, 422, 'PRODUCTS_NOT_ORDERABLE');
});
add(5, 'ORD05', 'UUIDs, campos fechados, duplicação e inelegibilidade', 'Enviar ID inválido/objeto/null/LF/maiúsculo; extras na raiz/cliente/item; repetidos; inativo e ausente juntos.', '400 nos inválidos/extras; 422 duplicados/inelegíveis e erros de ambos os itens; zero inserts.', async () => {
  for (const productId of ['bad', null, { $ne: null }, ids[0] + '\n', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA']) await rejectOrder({ ...canonical(), items: [{ productId, quantity: 1 }] });
  for (const body of [{ ...canonical(), total: 1 }, { ...canonical(), customer: { ...canonical().customer, customerId: randomUUID() } }, { ...canonical(), items: [{ productId: ids[0], quantity: 1, unitPrice: 1 }] }]) await rejectOrder(body);
  await rejectOrder({ ...canonical(), items: [canonical().items[0], canonical().items[0]] }, 422, 'DUPLICATE_PRODUCT_IDS');
  const result = await rejectOrder({ ...canonical(), items: [{ productId: ids[3], quantity: 1 }, { productId: missing, quantity: 1 }] }, 422, 'PRODUCTS_NOT_ORDERABLE');
  assert.deepEqual(result.json.errors.map(e => e.code), ['PRODUCT_INACTIVE', 'PRODUCT_NOT_FOUND']);
});
add(5, 'ORD06', 'Parser HTTP, mídia e aliases de rota', 'Enviar JSON quebrado e >64KiB; text/plain na rota canônica, com barra final e caixa variante.', '400 INVALID_JSON, 413 PAYLOAD_TOO_LARGE e 415 UNSUPPORTED_MEDIA_TYPE com Problem e correlação.', async () => {
  await rejectOrder(undefined, 400, 'INVALID_JSON', { raw: '{bad' });
  await rejectOrder(undefined, 413, 'PAYLOAD_TOO_LARGE', { raw: 'x'.repeat(65537) });
  for (const path of ['/api/v1/orders', '/api/v1/orders/', '/API/v1/orders']) await api('orders', path, 415, { raw: '{}', headers: { 'content-type': 'text/plain' }, code: 'UNSUPPORTED_MEDIA_TYPE' });
});
add(5, 'ORD07', 'SQL-like como texto e repetição explícita de POST', 'Criar nome com aspas/SQL; consultar; reenviar o mesmo POST duas vezes.', 'Texto literal, tabelas intactas; POST não idempotente cria IDs distintos, conforme contrato.', async () => {
  const body = { ...canonical(), customer: { name: "D'Angelo); DROP TABLE orders;--", email: 'literal-qa@example.com' } };
  const a = await create(body); const b = await create(body); assert.notEqual(a.json.id, b.json.id);
  assert.equal((await api('orders', `/api/v1/orders/${a.json.id}`, 200)).json.customer.name, body.customer.name);
});

add(6, 'GET01', 'ID existente, ausente, malformado e controle final', 'Criar fixture própria; GET existente/aleatório/texto/LF.', 'Snapshot exato; 404 ORDER_NOT_FOUND; 400 para UUID inválido.', async () => {
  const created = (await create()).json;
  sameSnapshot((await api('orders', `/api/v1/orders/${created.id}`, 200)).json, created);
  await api('orders', `/api/v1/orders/${randomUUID()}`, 404, { code: 'ORDER_NOT_FOUND' });
  for (const id of ['not-uuid', created.id + '%0A']) await api('orders', `/api/v1/orders/${id}`, 400, { code: 'VALIDATION_ERROR' });
});
add(6, 'GET02', 'Página padrão, limites, inválidos e página vazia', 'GET lista padrão e página além do fim; testar limites/extra/repetido/objeto.', 'Metadados coerentes, itemCount=linhas; 400 em parâmetros inválidos.', async () => {
  const result = await api('orders', '/api/v1/orders', 200); assert.equal(result.json.meta.pageSize, 20);
  const empty = await api('orders', '/api/v1/orders?page=1000000&pageSize=100', 200); assert.deepEqual(empty.json.data, []);
  for (const query of ['page=0', 'page=-1', 'page=1.5', 'page=01', 'page=1000001', 'pageSize=101', 'extra=1', 'page=1&page=2', 'page[x]=1']) await api('orders', `/api/v1/orders?${query}`, 400, { code: 'VALIDATION_ERROR' });
});
add(6, 'GET03', 'Alteração real de preço e snapshot histórico', 'Criar pedido; alterar preço/versão/data somente no Mongo de QA; criar outro; consultar ambos; restaurar produto.', 'Antigo mantém preço 20000/versão1; novo usa 30000/versão2; UTC e totais coerentes.', async () => {
  const body = { ...canonical(), items: [{ productId: ids[0], quantity: 3 }] };
  const old = (await create(body)).json;
  try {
    await mongo(`assert.eq(1,db.products.updateOne({_id:"${ids[0]}"},{$set:{priceCents:NumberLong("30000"),priceVersion:NumberInt(2),updatedAt:new Date("2026-10-23T03:00:00Z")}}).modifiedCount);`);
    const fresh = (await create(body)).json; assert.equal(fresh.items[0].unitPriceCents, 30000); assert.equal(fresh.items[0].priceVersion, 2); assert.equal(fresh.totalCents, 81000);
    sameSnapshot((await api('orders', `/api/v1/orders/${old.id}`, 200)).json, old); assert.equal(old.totalCents, 54000);
  } finally { await mongo(`db.products.updateOne({_id:"${ids[0]}"},{$set:{priceCents:NumberLong("20000"),priceVersion:NumberInt(1),updatedAt:new Date("2026-10-21T12:00:00Z")}});`); }
});
add(6, 'GET04', 'Concorrência e autorização atual', 'Disparar 5 criações concorrentes com mesmo corpo; consultar/listar sem Authorization e com header arbitrário.', '5 IDs únicos, agregados completos; API pública conforme security:[]; não há papéis/tenants implementados.', async () => {
  const before = await countOrders(); const results = await Promise.all(Array.from({ length: 5 }, () => create()));
  assert.equal(new Set(results.map(r => r.json.id)).size, 5); assert.equal(await countOrders(), before + 5);
  for (const item of results) assert.equal((await api('orders', `/api/v1/orders/${item.json.id}`, 200)).json.items.length, 2);
  await api('orders', '/api/v1/orders', 200, { headers: { authorization: 'Bearer qa-synthetic' } });
  currentEvidence.push({ boundary: 'security: []; sem identidade/tenant ou exclusão lógica no runtime; não alegar isolamento' });
});

add(7, 'ERR01', 'Catálogo parado não impede histórico nem readiness SQL', 'Criar pedido; parar somente Catálogo de QA; testar criação/GET/lista/health; reiniciar em finally.', 'Sem insert: recusa de conexão gera 503 CATALOG_UNAVAILABLE; rede que excede 2s gera 504 CATALOG_TIMEOUT. GET/lista/live/ready de Pedidos continuam 200; recuperação.', async () => {
  const created = (await create()).json;
  await compose('stop', 'catalog');
  try {
    const failure = await rejectOrder(canonical(), [503, 504], { 503: 'CATALOG_UNAVAILABLE', 504: 'CATALOG_TIMEOUT' });
    if (failure.response.status === 504) assert.ok(currentEvidence.findLast(e => e.service === 'orders').durationMs >= 1900, 'Timeout precisa respeitar o deadline');
    sameSnapshot((await api('orders', `/api/v1/orders/${created.id}`, 200)).json, created);
    await api('orders', '/api/v1/orders', 200); await api('orders', '/health/ready', 200); await api('orders', '/health/live', 200);
  } finally { await compose('start', 'catalog'); await waitReady('catalog'); }
  await create();
});
add(7, 'ERR02', 'Fornecedor inválido, 4xx, 5xx, corpo excessivo e timeout', 'Executar suíte do cliente HTTP com stubs, limite descomprimido 256KiB e timeout inclusive durante body.', '502/503/504 corretos, resposta sanitizada, apenas uma chamada, cancelamento observado.', async () => {
  await ps('npx vitest run test/catalog-http-client.spec.ts test/create-order.spec.ts', { cwd: join(root, 'pedidos-typescript') });
});
add(7, 'ERR03', 'Mongo indisponível e recuperação', 'Parar Mongo de QA; ler live/ready/lista/lote; criar pedido; reiniciar e aguardar readiness.', 'Live 200; ready/lista/lote 503 sanitizados; Pedidos 503 sem persistir; serviço recupera.', async () => {
  await compose('stop', 'mongo');
  try {
    await api('catalog', '/health/live', 200);
    assert.equal((await api('catalog', '/health/ready', 503)).json.status, 'DOWN');
    await api('catalog', '/api/v1/products', 503, { code: 'PERSISTENCE_UNAVAILABLE' });
    await api('catalog', '/api/v1/products/query', 503, { body: { productIds: [ids[0]] }, code: 'PERSISTENCE_UNAVAILABLE' });
    await rejectOrder(canonical(), 503, 'CATALOG_UNAVAILABLE');
  } finally { await compose('start', 'mongo'); await waitReady('catalog'); }
  await create();
});
add(7, 'ERR04', 'PostgreSQL indisponível e recuperação do processo', 'Reiniciar Orders para descartar conexões HTTP ociosas; aquecer Catálogo; fechar conexões do harness; parar postgres de QA; testar live/ready/GET/lista/POST; reiniciar.', 'Live 200; ready DOWN; GET/lista/POST 503 PERSISTENCE_UNAVAILABLE; sem queda do processo; recuperação.', async () => {
  await compose('restart', 'orders'); await waitReady('orders'); await create();
  const restarts = Number((await command('docker', ['inspect', `${project}-orders-1`, '--format', '{{.RestartCount}}'])).trim());
  await pool.end(); pool = undefined; await runtimePool.end(); runtimePool = undefined; await migrationPool.end(); migrationPool = undefined;
  await compose('stop', 'postgres');
  try {
    await api('orders', '/health/live', 200);
    await api('orders', '/api/v1/orders', 503, { code: 'PERSISTENCE_UNAVAILABLE' });
    assert.equal((await api('orders', '/health/ready', 503)).json.status, 'DOWN');
    await api('orders', `/api/v1/orders/${randomUUID()}`, 503, { code: 'PERSISTENCE_UNAVAILABLE' });
  } finally { await compose('start', 'postgres'); await waitReady('orders'); connectPools(); }
  assert.equal(Number((await command('docker', ['inspect', `${project}-orders-1`, '--format', '{{.RestartCount}}'])).trim()), restarts, 'API reiniciou durante indisponibilidade do banco');
  await create();
});
add(7, 'ERR05', 'Classificação de erro SQL inesperado e rollback', 'Instalar trigger sintético que lança P0001 em order_items; POST; verificar zero resíduos; remover trigger em finally.', '500 INTERNAL_ERROR para exceção inesperada; transação revertida e conexão reutilizável.', async () => {
  const before = await countOrders();
  await pool.query("CREATE OR REPLACE FUNCTION qa_fail_item() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA unexpected error'; END; $$");
  await pool.query('CREATE TRIGGER qa_fail_item BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION qa_fail_item()');
  try { await rejectOrder(canonical(), 500, 'INTERNAL_ERROR'); assert.equal(await countOrders(), before); }
  finally { await pool.query('DROP TRIGGER qa_fail_item ON order_items'); await pool.query('DROP FUNCTION qa_fail_item()'); }
  await create();
});
add(7, 'ERR06', 'Lock timeout SQL e liberação de conexão', 'Manter LOCK ACCESS EXCLUSIVE via conexão admin; criar; rollback do lock; repetir criação.', '503 PERSISTENCE_UNAVAILABLE em até 7s; nenhuma linha nova; reteste cria normalmente.', async () => {
  const before = await countOrders(); const blocker = await pool.connect(); await blocker.query('BEGIN');
  try {
    await blocker.query('LOCK TABLE orders IN ACCESS EXCLUSIVE MODE');
    await api('orders', '/api/v1/orders', 503, { body: canonical(), code: 'PERSISTENCE_UNAVAILABLE' });
  } finally { await blocker.query('ROLLBACK'); blocker.release(); }
  assert.equal(await countOrders(), before); await create();
});
add(7, 'ERR07', 'Queda durante COMMIT: limite e observabilidade', 'Usar proxy TCP local para suprimir o ACK depois que PostgreSQL confirmar COMMIT; verificar resposta, linha persistida, ausência de retry e log sanitizado.', 'Uma chamada 503 PERSISTENCE_UNAVAILABLE; exatamente um pedido e duas linhas já confirmados no banco; processo vivo e log marca resultado ambíguo sem retry.', async () => {
  const output = await command('node', ['docs/qa/scripts/err07-ambiguous-commit.mjs'], {
    env: {
      ORDERS_DATABASE_URL: hostUrl(secrets.ORDERS_DATABASE_URL),
      ORDERS_MIGRATION_DATABASE_URL: hostUrl(secrets.ORDERS_MIGRATION_DATABASE_URL),
      CATALOG_URL: catalogUrl,
      QA_POSTGRES_PORT: secrets.POSTGRES_PORT,
      DISCOUNT_ENABLED: secrets.DISCOUNT_ENABLED,
      DISCOUNT_RULE_ID: secrets.DISCOUNT_RULE_ID,
      DISCOUNT_MIN_SUBTOTAL_CENTS: secrets.DISCOUNT_MIN_SUBTOTAL_CENTS,
      DISCOUNT_RATE_BPS: secrets.DISCOUNT_RATE_BPS,
    },
  });
  const observed = JSON.parse(output.trim().split(/\r?\n/).at(-1));
  assert.deepEqual(
    { apiStatus: observed.apiStatus, apiCode: observed.apiCode, commitQueries: observed.commitQueries,
      commitAcknowledgementsSuppressed: observed.commitAcknowledgementsSuppressed,
      committedOrders: observed.committedOrders, committedItems: observed.committedItems,
      processLiveStatus: observed.processLiveStatus, productionTraffic: observed.productionTraffic },
    { apiStatus: 503, apiCode: 'PERSISTENCE_UNAVAILABLE', commitQueries: 1,
      commitAcknowledgementsSuppressed: 1, committedOrders: 1, committedItems: 2,
      processLiveStatus: 200, productionTraffic: false },
  );
  assert.match(observed.ambiguousLog, /Order commit outcome ambiguous retry=false/);
  currentEvidence.push({ result: observed });
});

add(8, 'DAT01', 'Integração PostgreSQL: rollback, snapshots, páginas e papéis', 'Executar suíte de integração com URLs de QA apontando exclusivamente orders_test.', 'Testes reais aprovados; runtime sem UPDATE/DELETE/DDL/metadados; empate de data ordenado por ID.', async () => {
  const env = {
    ORDERS_TEST_DATABASE_URL: hostUrl(secrets.ORDERS_TEST_DATABASE_URL),
    ORDERS_TEST_MIGRATION_DATABASE_URL: hostUrl(secrets.ORDERS_TEST_MIGRATION_DATABASE_URL),
  };
  await ps('npm run test:integration', { cwd: join(root, 'pedidos-typescript'), env });
});
add(8, 'DAT02', 'Migração repetida e concorrente', 'Executar dois jobs orders-migrate simultâneos; comparar versão/checksum SQL.', 'Ambos verificam migration sem reaplicar; uma versão, checksum inalterado.', async () => {
  const before = (await pool.query('SELECT version,checksum FROM schema_migrations ORDER BY version')).rows;
  await Promise.all([compose('run', '--rm', '--no-deps', 'orders-migrate'), compose('run', '--rm', '--no-deps', 'orders-migrate')]);
  assert.deepEqual((await pool.query('SELECT version,checksum FROM schema_migrations ORDER BY version')).rows, before);
});
add(8, 'DAT03', 'Seed repetido preserva alteração existente', 'Alterar preço sintético em QA; executar bootstrap duas vezes; verificar quatro produtos e preço; restaurar.', 'Sem duplicação/sobrescrita; índices e validator mantidos.', async () => {
  try {
    await mongo(`db.products.updateOne({_id:"${ids[2]}"},{$set:{priceCents:NumberLong("102"),priceVersion:NumberInt(2)}});`);
    await compose('run', '--rm', '--no-deps', 'mongo-bootstrap'); await compose('run', '--rm', '--no-deps', 'mongo-bootstrap');
    await mongo(`assert.eq(4,db.products.countDocuments({}));assert.eq("102",db.products.findOne({_id:"${ids[2]}"}).priceCents.toString());print("Seed repetido: 4 produtos; preço preservado");`);
  } finally { await mongo(`db.products.updateOne({_id:"${ids[2]}"},{$set:{priceCents:NumberLong("101"),priceVersion:NumberInt(1)}});`); }
});
add(8, 'DAT04', 'Validator e índice único rejeitam dados inválidos', 'Tentar preço zero/double, moeda inválida, controle e SKU duplicado no Mongo de QA; limpar UUID sintético.', 'Código 121 nos documentos inválidos e 11000 em SKU repetido; nada residual.', async () => {
  await mongo(`const id="88888888-8888-4888-8888-888888888888"; const base={_id:id,sku:"QA-SYNTH",name:"QA",currency:"BRL",priceCents:NumberLong("1"),active:true,priceVersion:NumberInt(1),updatedAt:new Date()}; try { for(const patch of [{priceCents:NumberLong("0")},{priceCents:1.5},{currency:"USD"},{name:"QA\\u0000X"}]) { let err;try{db.products.insertOne({...base,...patch});}catch(e){err=e;}assert.eq(121,err?.code); } let dup;try{db.products.insertOne({...base,sku:"TEC-001"});}catch(e){dup=e;}assert.eq(11000,dup?.code);print("Validator 121; SKU único 11000"); } finally {db.products.deleteOne({_id:id});}`);
});
add(8, 'DAT05', 'Permissão Mongo somente leitura', 'Autenticar como catalog_runtime e tentar inserir documento válido em QA.', 'Acesso recusado código 13; leitura permitida.', async () => {
  const runtimeUri = `mongodb://catalog_runtime:${encodeURIComponent(secrets.CATALOG_RUNTIME_PASSWORD)}@127.0.0.1:27017/catalog?authSource=catalog`;
  await mongo(`const u=db.getUser("catalog_runtime");assert.eq("read",u.roles[0].role);const runtime=new Mongo(${JSON.stringify(runtimeUri)}).getDB("catalog");assert.eq(4,runtime.products.countDocuments({}));let denied;try{runtime.products.insertOne({_id:"77777777-7777-4777-8777-777777777777",sku:"QA-RUNTIME",name:"QA",currency:"BRL",priceCents:NumberLong("1"),active:true,priceVersion:NumberInt(1),updatedAt:new Date()});}catch(e){denied=e;}assert.eq(13,denied?.code);print("Runtime: leitura permitida, escrita negada código 13");`);
});
add(8, 'DAT06', 'Uma consulta de lote e índices reais', 'Inspecionar explain do lote/página; contar find por requisição usando profiler restaurado no final.', 'Lotes 1/10/100: um find; plano _id_ para lote e ix_products_active_id para página.', async () => {
  await mongo(`const batch=JSON.stringify(db.products.find({_id:{$in:["${ids[0]}","${missing}"]}}).explain("queryPlanner").queryPlanner.winningPlan);const page=JSON.stringify(db.products.find({active:true}).sort({_id:1}).limit(20).explain("queryPlanner").queryPlanner.winningPlan);assert(batch.includes('"indexName":"_id_"'));assert(page.includes('"indexName":"ix_products_active_id"'));print(batch);print(page);`);
  const prior = await mongo('print(db.getProfilingStatus().was);');
  const level = Number(prior.trim().split('\n').at(-1)); assert.ok([0, 1, 2].includes(level));
  try {
    await mongo('db.setProfilingLevel(2,{slowms:0});');
    for (const n of [1, 10, 100]) {
      const marker = randomUUID(); const productIds = Array.from({ length: n }, (_, i) => i ? randomUUID() : marker);
      await api('catalog', '/api/v1/products/query', 200, { body: { productIds } });
      await mongo(`assert.eq(1,db.system.profile.countDocuments({"command.find":"products","command.filter._id.$in":"${marker}"}));print("${n} IDs: 1 find");`);
    }
  } finally { await mongo(`db.setProfilingLevel(${level},{slowms:100});`); }
});

add(9, 'GAT01', 'Contratos runtime e exemplos OpenAPI', 'Executar validador Python canônico contra URLs de QA.', 'Requests/respostas reais aderem aos schemas OpenAPI e códigos comuns.', async () => {
  await command(documentationPython, ['docs/validation/validar-contratos-runtime.py'], { env: { ORDERS_API_URL: ordersUrl, CATALOG_API_URL: catalogUrl } });
});
add(9, 'GAT02', 'Regressão TypeScript, lint, tipos e build', 'Executar npm test, typecheck e lint no projeto Pedidos.', 'Todas as suítes, tipos, lint e build (pretest) aprovados.', async () => {
  for (const script of ['test', 'typecheck', 'lint']) await ps(`npm run ${script}`, { cwd: join(root, 'pedidos-typescript') });
});
add(9, 'GAT03', 'Regressão .NET, formatação e build', 'Executar dotnet format --verify-no-changes, build e testes Release.', 'Sem alteração necessária de formato; build e testes aprovados.', async () => {
  const cwd = join(root, 'catalogo-dotnet');
  await command('dotnet', ['format', 'Catalog.sln', '--verify-no-changes', '--no-restore'], { cwd });
  await command('dotnet', ['build', 'Catalog.sln', '-c', 'Release', '--no-restore'], { cwd });
  await command('dotnet', ['test', 'Catalog.sln', '-c', 'Release', '--no-build', '--no-restore'], { cwd });
});
add(9, 'GAT04', 'Smoke e documentação', 'Executar smoke contra QA e validador documental; consultar documentos Swagger.', 'Smoke e documentação aprovados; operações de API documentadas.', async () => {
  await command('node', ['infra/smoke-system.mjs'], { env: { CHALLENGE_API_URL: ordersUrl } });
  await command(documentationPython, ['docs/validation/validar-especificacoes.py']);
  await api('orders', '/docs-json', 200); await api('catalog', '/swagger/v1/swagger.json', 200);
});
add(9, 'GAT05', 'Logs sem dados pessoais ou segredos', 'Inspecionar logs das APIs após entradas sintéticas, falhas e recuperação.', 'Sem nomes/e-mails de clientes, URLs de conexão, senhas, corpo ou SQL.', async () => {
  for (const service of ['orders', 'catalog']) {
    const output = await command('docker', ['logs', `${project}-${service}-1`]);
    assert.equal(currentEvidence.at(-1).containsSecret, false, 'Log continha segredo; evidência foi sanitizada');
    assert.doesNotMatch(output, /qa@example\.com|literal-qa@example\.com|DROP TABLE orders|QA Cliente|postgresql:\/\/|mongodb:\/\//);
    for (const [key, value] of Object.entries(secrets)) if (key.includes('PASSWORD')) assert.ok(!output.includes(value));
  }
});
add(9, 'GAT06', 'CI hospedada, release e publicação externa', 'Inspecionar remoto e workflow; verificar execução ligada ao SHA se existir.', 'Sem remoto/credencial/destino definido, registrar bloqueio concreto; nunca publicar produção.', async () => {
  const remote = (await command('git', ['remote'])).trim();
  const workflow = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.ok(workflow.includes('npm test') && workflow.includes('dotnet test'));
  assert.ok(!/continue-on-error:\s*true/.test(workflow));
  currentEvidence.push({ remoteConfigured: Boolean(remote), releaseDeployJobs: /\n\s+(deploy|release):/.test(workflow) });
  return { status: 'BLOQUEADO', reason: remote ? 'Nenhuma execução hospedada ou ambiente de QA remoto identificado/autorizado para este SHA. Publicação local de QA comprovada em ENV03.' : 'git remote não retorna remotos; não há CI hospedada, registry ou destino de QA cloud configurado. Publicação local de QA comprovada em ENV03; produção não recebeu tráfego.' };
});
add(9, 'GAT07', 'Metas de carga/cobertura e artefatos da candidatura', 'Confrontar metas Q46-Q50 e documentação com ferramentas/artefatos realmente presentes.', 'Limites externos e medições não executadas ficam explícitos; não inferir porcentagem ou SLO de testes passados.', async () => {
  currentEvidence.push({ scope: 'Runtime testado por esta campanha; benchmark anterior não reutilizado como nova evidência. Sem suíte de 1000 criações/10 itens ou thresholds de cobertura instalados.' });
  return { status: 'NÃO EXECUTADO', reason: 'Meta interna de carga de escrita e metas percentuais de cobertura não têm harness/gate implementado. Link compartilhável de IA, CI hospedada e pacote final da candidatura dependem da entrega externa já aberta em T08/T33/T41-T45; não fazem parte de uma aprovação de runtime local.' };
});

function hostUrl(value) {
  const url = new URL(value); assert.equal(url.hostname, 'postgres'); assert.ok(['/orders', '/orders_test'].includes(url.pathname));
  url.hostname = '127.0.0.1'; url.port = secrets.POSTGRES_PORT; return url.toString();
}
function connectPools() {
  const { Pool } = createRequire(join(root, 'pedidos-typescript/package.json'))('pg');
  const adminUri = `postgresql://postgres_admin:${encodeURIComponent(secrets.POSTGRES_ADMIN_PASSWORD)}@127.0.0.1:${secrets.POSTGRES_PORT}/orders`;
  pool = new Pool({ connectionString: adminUri, max: 4 });
  runtimePool = new Pool({ connectionString: hostUrl(secrets.ORDERS_DATABASE_URL), max: 2 });
  migrationPool = new Pool({ connectionString: hostUrl(secrets.ORDERS_MIGRATION_DATABASE_URL), max: 2 });
  for (const item of [pool, runtimePool, migrationPool]) item.on('error', () => { /* expected only during controlled DB interruption */ });
}
async function plan() {
  await mkdir(join(qa, 'planos'), { recursive: true }); await mkdir(join(qa, 'evidencias'), { recursive: true });
  for (let index = 0; index < areas.length; index++) {
    const [slug, title, refs, prerequisites] = areas[index];
    const content = [`# ${title}`, '', `Requisitos: ${refs}.`, '', `## Objetivo e escopo`, '', title + '. Comportamentos confirmados no código, contratos e specs, com oráculos independentes.', '', '## Pré-condições e dados', '', prerequisites, 'Ambiente: QA local isolado, projeto Compose `desafio-qa-20261022`. Dados: nomes/e-mails sintéticos; UUIDs fixos do seed e aleatórios. Nenhuma conta externa.', '', '## Execução', '', `Executar \`node docs/qa/scripts/campanha.mjs --area=${index + 1}\`. Casos em ordem; parar na primeira divergência e retestar o ID antes de retomar. Não executar a próxima área com falha pendente.`, ''];
    for (const item of cases.filter(c => c.area === index + 1)) content.push(`## ${item.id} — ${item.title}`, '', `1. ${item.steps}`, `2. Conferir: ${item.expected}`, '3. Guardar o resultado e a evidência JSON/comando. Em rejeições de criação, comparar a contagem SQL antes/depois.', '', `**Esperado:** ${item.expected}`, '', `**Evidência exigida:** registro de ${item.id} em [execução](../execucao.json), com horário, ambiente, esperado, observado, headers/body ou log do comando.`, '', '**Estado inicial:** NÃO EXECUTADO. O estado atual e todas as tentativas ficam no relatório gerado.', '');
    await writeFile(join(qa, 'planos', `${slug}.md`), content.join('\n'));
  }
}
const args = process.argv.slice(2);
if (args.includes('--planejar')) { await plan(); console.log(`${cases.length} casos planejados em ${areas.length} arquivos.`); }
else {
  await mkdir(join(qa, 'evidencias'), { recursive: true });
  secrets = Object.fromEntries((await readFile(join(local, '.env'), 'utf8')).split(/\r?\n/).filter(line => line.includes('=')).map(line => { const split = line.indexOf('='); return [line.slice(0, split), line.slice(split + 1)]; }));
  assert.deepEqual([secrets.ORDERS_PORT, secrets.CATALOG_PORT, secrets.POSTGRES_PORT, secrets.MONGO_PORT], ['33000', '38080', '35432', '37017']);
  let state;
  try { state = JSON.parse(await readFile(join(qa, 'execucao.json'), 'utf8')); }
  catch { state = { campaign: '2026-10-22', environment: project, baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), cases: {} }; }
  for (const item of cases) {
    state.cases[item.id] ??= { title: item.title, area: item.area, expected: item.expected, status: 'NÃO EXECUTADO', attempts: [] };
    state.cases[item.id].expected = item.expected;
  }
  const area = Number(args.find(a => a.startsWith('--area='))?.split('=')[1]);
  const selectedId = args.find(a => a.startsWith('--caso='))?.split('=')[1];
  const selected = cases.filter(c => (!area || c.area === area) && (!selectedId || c.id === selectedId));
  assert.ok(selected.length, 'Nenhum caso selecionado');
  if (selected[0].area > 1) connectPools();
  try {
    for (const item of selected) {
      if (!selectedId && state.cases[item.id].status === 'PASSOU') continue;
      const earlierFailure = cases.find(c => cases.indexOf(c) < cases.indexOf(item) && state.cases[c.id].status === 'FALHOU');
      assert.ok(!earlierFailure, `Retestar primeiro ${earlierFailure?.id}`);
      currentId = `${item.id}-t${state.cases[item.id].attempts.length + 1}`; currentEvidence = []; commandSequence = 0;
      const startedAt = new Date().toISOString();
      console.log(`EXECUTANDO ${item.id}: ${item.title}`);
      let status = 'PASSOU'; let reason = 'Asserções e resultados esperados conferidos.';
      try {
        const outcome = await item.run(); if (outcome) { status = outcome.status; reason = outcome.reason; }
        if (item.id === 'ENV03' && !pool) connectPools();
      } catch (error) { status = 'FALHOU'; reason = redact(error.message); }
      const attempt = { startedAt, finishedAt: new Date().toISOString(), environment: project, expected: item.expected, status, observed: reason, evidence: currentEvidence };
      state.cases[item.id].attempts.push(attempt); state.cases[item.id].status = status;
      await writeFile(join(qa, 'execucao.json'), JSON.stringify(state, null, 2) + '\n');
      console.log(`${status} ${item.id}: ${reason.slice(0, 500)}`);
      if (status === 'FALHOU') { process.exitCode = 1; break; }
    }
  } finally { for (const item of [pool, runtimePool, migrationPool]) if (item) await item.end(); }
}
