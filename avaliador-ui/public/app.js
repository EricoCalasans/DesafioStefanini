const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const API_PREFIX = { catalog: '/api/catalog', orders: '/api/orders' };
const PRODUCT_IDS = {
  keyboard: '11111111-1111-4111-8111-111111111111',
  mouse: '22222222-2222-4222-8222-222222222222',
  inactive: '44444444-4444-4444-8444-444444444444',
  missing: '99999999-9999-4999-8999-999999999999',
};
const SAMPLE_CUSTOMER = { name: 'Cliente Exemplo', email: 'cliente@example.com' };
const SAMPLE_ORDER = {
  customer: SAMPLE_CUSTOMER,
  items: [
    { productId: PRODUCT_IDS.keyboard, quantity: 2 },
    { productId: PRODUCT_IDS.mouse, quantity: 1 },
  ],
};

let products = [];
let orderItems = [{ productId: '', manualId: '', quantity: '1' }];
let toastTimer;
let selectedOrderId = '';
let orders = [];
let isSubmittingOrder = false;
let isLoadingProducts = false;
let isLoadingOrders = false;
let isLookingUpProduct = false;
let isLookingUpOrder = false;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function formatMoney(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function shortId(value) {
  if (!value || value.length < 16) return value ?? '—';
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function copyIdButton(value, accessibleName) {
  const label = accessibleName || 'Copiar ID';
  return `<button class="copy-button" type="button" data-copy-id="${escapeHtml(value)}" aria-label="${escapeHtml(label)}" title="Copiar ID"><svg class="copy-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 3.5V3A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v7A1.5 1.5 0 0 0 4 11.5h.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>`;
}

function makeCorrelationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function showToast(message, isError = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function renderLastRequest(requestInfo) {
  const panel = $('#lastRequest');
  const response = requestInfo.data;
  const isError = !requestInfo.ok;
  const correlationId = requestInfo.correlationId || response?.traceId || 'não informado';
  const statusText = requestInfo.status ? `${requestInfo.status} ${requestInfo.statusText ?? ''}`.trim() : 'sem resposta';
  const renderedResponse = JSON.stringify(response ?? null, null, 2);

  panel.innerHTML = `
    <div class="request-primary">
      <span class="service-badge">${requestInfo.service === 'orders' ? 'Pedidos' : 'Catálogo'}</span>
      <span class="method-badge">${escapeHtml(requestInfo.method)}</span>
      <span class="request-path">${escapeHtml(requestInfo.path)}</span>
      <span class="request-status ${isError ? 'error' : ''}">${escapeHtml(statusText)}</span>
    </div>
    <div class="request-meta">
      <span>Duração <strong>${escapeHtml(requestInfo.durationMs)} ms</strong></span>
      <span>Correlação <strong class="monospace">${escapeHtml(correlationId)}</strong></span>
      ${response?.code ? `<span>Código <strong>${escapeHtml(response.code)}</strong></span>` : ''}
    </div>
    <details id="rawResponseDetails" class="raw-response">
      <summary>Ver resposta JSON completa</summary>
      <pre id="rawResponse"></pre>
    </details>`;

  const rawDetails = $('#rawResponseDetails', panel);
  const rawElement = $('#rawResponse', panel);
  rawElement.textContent = renderedResponse;
  rawDetails.open = false;
}

async function callApi(service, apiPath, options = {}) {
  const method = options.method ?? 'GET';
  const proxyPath = `${API_PREFIX[service]}${apiPath}`;
  const correlationId = makeCorrelationId();
  const headers = { accept: 'application/json', 'x-correlation-id': correlationId };
  const requestOptions = { method, headers };
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    requestOptions.body = JSON.stringify(options.body);
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(proxyPath, requestOptions);
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; }
    catch { data = { message: raw || 'Resposta vazia.' }; }
    const result = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      method,
      path: apiPath,
      service,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      correlationId: response.headers.get('x-correlation-id') || data?.traceId || correlationId,
    };
    renderLastRequest(result);
    return result;
  } catch (error) {
    const result = {
      ok: false,
      status: 0,
      statusText: 'sem resposta',
      data: { title: 'Interface sem conexão', detail: 'Não foi possível alcançar o proxy local. Confirme se o serviço avaliador está em execução.' },
      method,
      path: apiPath,
      service,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      correlationId,
    };
    renderLastRequest(result);
    console.warn('Falha ao chamar a interface local:', error);
    return result;
  }
}

function setButtonLoading(button, loading, text) {
  if (!button) return;
  button.disabled = loading;
  const label = $('[data-label]', button);
  if (label) {
    if (loading) {
      button.dataset.originalLabel ??= label.textContent;
      label.textContent = text;
    } else if (button.dataset.originalLabel) {
      label.textContent = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
  }
}

function setButtonsLoading(buttons, loading, text) {
  for (const button of buttons) setButtonLoading(button, loading, text);
}

function renderHealthCard(elementId, liveResult, readyResult) {
  const card = $(`#${elementId}`);
  const state = $('.health-state', card);
  const detail = $('.health-detail', card);
  const indicator = $('.status-indicator', card);
  const isAlive = liveResult.ok && liveResult.data?.status === 'UP';
  const isReady = readyResult.ok && readyResult.data?.status === 'UP';
  const checks = Array.isArray(readyResult.data?.checks)
    ? readyResult.data.checks.map((check) => `${check.name}: ${check.status === 'UP' ? 'pronto' : 'indisponível'}`).join(' · ')
    : '';
  const labelClass = isReady ? 'state-ok' : isAlive ? 'state-warning' : 'state-down';
  state.className = `health-state ${labelClass}`;
  state.textContent = isReady ? 'Pronto' : isAlive ? 'API ativa · dependência indisponível' : 'Indisponível';
  detail.textContent = `Liveness ${isAlive ? 'UP' : 'DOWN'} · Readiness ${isReady ? 'UP' : 'DOWN'}${checks ? ` · ${checks}` : ''}`;
  indicator.className = `status-indicator ${isReady ? 'ok' : isAlive ? 'warn' : 'down'}`;
}

async function refreshHealth() {
  const button = $('#refreshHealth');
  if (button.disabled) return;
  setButtonLoading(button, true, 'Verificando…');
  for (const id of ['ordersHealth', 'catalogHealth']) {
    const card = $(`#${id}`);
    $('.health-state', card).textContent = 'Verificando…';
    $('.health-state', card).className = 'health-state state-loading';
    $('.health-detail', card).textContent = 'Consultando API e banco de dados…';
    $('.status-indicator', card).className = 'status-indicator loading';
  }

  const [ordersLive, ordersReady, catalogLive, catalogReady] = await Promise.all([
    callApi('orders', '/health/live'),
    callApi('orders', '/health/ready'),
    callApi('catalog', '/health/live'),
    callApi('catalog', '/health/ready'),
  ]);
  renderHealthCard('ordersHealth', ordersLive, ordersReady);
  renderHealthCard('catalogHealth', catalogLive, catalogReady);
  setButtonLoading(button, false);
}

function productOptions(item) {
  const currentIsActive = products.some((product) => product.id === item.productId);
  const options = [
    '<option value="">Selecione um produto ativo</option>',
    ...products.map((product) => `<option value="${escapeHtml(product.id)}" ${product.id === item.productId ? 'selected' : ''}>${escapeHtml(product.name)} · ${escapeHtml(product.sku)} · ${escapeHtml(formatMoney(product.priceCents))}</option>`),
    `<option value="__manual__" ${item.manualId || (item.productId && !currentIsActive) ? 'selected' : ''}>Informar UUID manual…</option>`,
  ];
  return options.join('');
}

function renderOrderItems() {
  const container = $('#orderItems');
  container.innerHTML = orderItems.map((item, index) => {
    const manual = Boolean(item.manualId || (item.productId && !products.some((product) => product.id === item.productId)));
    return `
      <div class="order-item-row" data-item-index="${index}">
        <div class="item-field">
          <label for="itemProduct${index}">Produto ${index + 1}</label>
          <select id="itemProduct${index}" data-item-product required>${productOptions(item)}</select>
        </div>
        <div class="item-field">
          <label for="itemQuantity${index}">Quantidade</label>
          <input id="itemQuantity${index}" data-item-quantity type="number" min="1" max="10000" step="1" value="${escapeHtml(item.quantity)}" required />
        </div>
        <button class="remove-item" type="button" data-remove-item="${index}" aria-label="Remover item ${index + 1}" ${orderItems.length === 1 ? 'disabled title="O pedido precisa ter pelo menos um item"' : ''}>×</button>
        <div class="item-field manual-id-field" ${manual ? '' : 'hidden'}>
          <label for="itemManualId${index}">UUID manual · pode testar produto inativo ou ausente</label>
          <input id="itemManualId${index}" data-item-manual-id type="text" value="${escapeHtml(item.manualId || item.productId)}" placeholder="Cole um UUID do contrato" autocomplete="off" ${manual ? 'required' : 'disabled'} />
        </div>
      </div>`;
  }).join('');
}

function renderProductTable(data, meta) {
  const body = $('#productsBody');
  if (!data.length) {
    body.innerHTML = '<tr><td colspan="6" class="table-message">Nenhum produto ativo nesta página.</td></tr>';
  } else {
    body.innerHTML = data.map((product) => `
      <tr>
        <td class="product-name-cell">
          <strong>${escapeHtml(product.name)}</strong>
          <span class="id-copy-row"><span class="monospace" title="${escapeHtml(product.id)}">${escapeHtml(shortId(product.id))}</span>${copyIdButton(product.id, `Copiar ID do produto ${product.name}`)}</span>
        </td>
        <td><span class="monospace">${escapeHtml(product.sku)}</span></td>
        <td><strong>${escapeHtml(formatMoney(product.priceCents))}</strong></td>
        <td><span class="badge ${product.active ? 'badge-success' : 'badge-warning'}">${product.active ? 'Ativo' : 'Inativo'}</span></td>
        <td><span class="monospace">v${escapeHtml(product.priceVersion)}</span></td>
        <td><button class="table-action" type="button" data-lookup-product="${escapeHtml(product.id)}">Ver produto</button></td>
      </tr>`).join('');
  }

  $('#productMeta').textContent = meta.totalItems
    ? `Página ${meta.page} · ${meta.totalItems} produtos ativos · ${meta.totalPages} ${meta.totalPages === 1 ? 'página' : 'páginas'}`
    : `Página ${meta.page} · catálogo sem produtos ativos`;
  $('#productPage').value = String(meta.page);
  $('#productPageSize').value = String(meta.pageSize);
  $('#productNotice').textContent = '';
}

async function loadProducts() {
  if (isLoadingProducts) return;
  isLoadingProducts = true;
  const button = $('#searchProducts');
  const reloadButton = $('#reloadProducts');
  setButtonsLoading([button, reloadButton], true, 'Buscando…');
  const page = $('#productPage').value.trim() || '1';
  const pageSize = $('#productPageSize').value.trim() || '20';
  const query = `?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`;
  $('#productsTable').setAttribute('aria-busy', 'true');
  $('#productMeta').textContent = 'Buscando produtos…';
  try {
    const result = await callApi('catalog', `/api/v1/products${query}`);
    const pageData = result.data;
    const meta = pageData?.meta;
    if (!result.ok || !Array.isArray(pageData?.data) || !meta || !Number.isInteger(meta.page) || !Number.isInteger(meta.pageSize) || !Number.isInteger(meta.totalItems) || !Number.isInteger(meta.totalPages)) {
      $('#productMeta').textContent = products.length ? 'Falha ao atualizar; a listagem anterior continua visível.' : 'A listagem não pôde ser carregada.';
      if (!products.length) $('#productsBody').innerHTML = '<tr><td colspan="6" class="table-message">Confira o estado do Catálogo e tente novamente.</td></tr>';
      $('#productNotice').textContent = result.data?.detail || result.data?.title || 'Erro ao listar produtos.';
      return;
    }

    products = pageData.data;
    renderProductTable(products, meta);
    renderOrderItems();
  } finally {
    $('#productsTable').setAttribute('aria-busy', 'false');
    setButtonsLoading([button, reloadButton], false);
    isLoadingProducts = false;
  }
}

function renderProductDetail(product) {
  return `
    <div class="result-detail">
      <div class="result-product">
        <div class="result-product-main">
          <strong>${escapeHtml(product.name)}</strong>
          <span class="monospace">${escapeHtml(product.sku)}</span>
          <span class="id-copy-row"><span class="monospace" title="${escapeHtml(product.id)}">${escapeHtml(shortId(product.id))}</span>${copyIdButton(product.id, 'Copiar ID do produto')}</span>
        </div>
        <span class="badge ${product.active ? 'badge-success' : 'badge-warning'}">${product.active ? 'Ativo' : 'Inativo'}</span>
      </div>
      <p><strong>${escapeHtml(formatMoney(product.priceCents))}</strong> · versão ${escapeHtml(product.priceVersion)}</p>
      <p class="muted-copy">Atualizado em ${escapeHtml(formatDate(product.updatedAt))}</p>
    </div>`;
}

function renderApiError(container, result) {
  const data = result.data ?? {};
  const errors = Array.isArray(data.errors)
    ? `<ul>${data.errors.map((error) => `<li><strong>${escapeHtml(error.field)}:</strong> ${escapeHtml(error.message)}</li>`).join('')}</ul>`
    : '';
  container.innerHTML = `
    <div class="api-error-card">
      <strong>${escapeHtml(data.title || (result.status ? `Resposta HTTP ${result.status}` : 'Não foi possível concluir a chamada'))}</strong>
      <p>${escapeHtml(data.detail || data.message || 'Confira os dados e a disponibilidade do serviço.')}</p>
      ${data.code ? `<span class="error-code">${escapeHtml(data.code)}</span>` : ''}
      ${errors}
    </div>`;
}

async function lookupProduct(productId, button) {
  const value = productId.trim();
  const target = $('#singleProductResult');
  if (isLookingUpProduct) return;
  if (!value) {
    target.innerHTML = '<p class="muted-copy">Informe um UUID para consultar o produto.</p>';
    $('#productLookupId').focus();
    return;
  }
  isLookingUpProduct = true;
  target.setAttribute('aria-busy', 'true');
  setButtonLoading(button, true, 'Consultando…');
  try {
    const result = await callApi('catalog', `/api/v1/products/${encodeURIComponent(value)}`);
    if (!result.ok) renderApiError(target, result);
    else if (!result.data?.id) renderApiError(target, { status: 502, data: { title: 'Resposta inesperada do Catálogo', detail: 'A API respondeu sem os dados de produto esperados.' } });
    else target.innerHTML = renderProductDetail(result.data);
  } finally {
    target.setAttribute('aria-busy', 'false');
    setButtonLoading(button, false);
    isLookingUpProduct = false;
  }
}

function renderBatchResult(result) {
  const target = $('#batchResult');
  if (!result.ok) {
    renderApiError(target, result);
    return;
  }

  if (!Array.isArray(result.data?.products) || !Array.isArray(result.data?.missingProductIds)) {
    renderApiError(target, { status: 502, data: { title: 'Resposta inesperada do Catálogo', detail: 'A resposta da consulta em lote não corresponde ao formato esperado.' } });
    return;
  }

  const { products: found = [], missingProductIds: missing = [], observedAt } = result.data;
  const foundList = found.length
    ? found.map((product) => `<div class="result-product"><div class="result-product-main"><strong>${escapeHtml(product.name)}</strong><span class="monospace">${escapeHtml(product.sku)}</span><span class="id-copy-row"><span class="monospace" title="${escapeHtml(product.id)}">${escapeHtml(shortId(product.id))}</span>${copyIdButton(product.id, 'Copiar ID do produto')}</span><span class="result-price">${escapeHtml(formatMoney(product.priceCents))}</span></div><span class="badge ${product.active ? 'badge-success' : 'badge-warning'}">${product.active ? 'Ativo' : 'Inativo'}</span></div>`).join('')
    : '<p>Nenhum produto encontrado.</p>';
  const missingList = missing.length
    ? `<div><h4>IDs ausentes (${missing.length})</h4><div class="missing-list">${missing.map((id) => `<span class="missing-id">${escapeHtml(id)}</span>`).join('')}</div></div>`
    : '';

  target.innerHTML = `<div class="result-detail"><div><h4>Encontrados (${found.length})</h4>${foundList}</div>${missingList}<p class="muted-copy">Observado em ${escapeHtml(formatDate(observedAt))}</p></div>`;
}

function fillBatchExample() {
  $('#batchIds').value = [PRODUCT_IDS.keyboard, PRODUCT_IDS.inactive, PRODUCT_IDS.missing].join('\n');
  showToast('Exemplo preenchido: ativo, inativo e UUID ausente.');
}

async function queryBatch(event) {
  event.preventDefault();
  const rawIds = $('#batchIds').value.split(/\r?\n/).map((id) => id.trim()).filter(Boolean);
  if (!rawIds.length) {
    $('#batchResult').innerHTML = '<p class="muted-copy">Cole ao menos um UUID, um por linha.</p>';
    return;
  }
  if (rawIds.length > 100) {
    $('#batchResult').innerHTML = '<p class="muted-copy">Informe no máximo 100 UUIDs por consulta.</p>';
    return;
  }
  const button = $('#batchForm button[type="submit"]');
  setButtonLoading(button, true, 'Consultando…');
  const result = await callApi('catalog', '/api/v1/products/query', { method: 'POST', body: { productIds: rawIds } });
  setButtonLoading(button, false);
  renderBatchResult(result);
}

function fillCanonicalOrder() {
  $('#customerName').value = SAMPLE_CUSTOMER.name;
  $('#customerEmail').value = SAMPLE_CUSTOMER.email;
  orderItems = [
    { productId: PRODUCT_IDS.keyboard, manualId: '', quantity: '2' },
    { productId: PRODUCT_IDS.mouse, manualId: '', quantity: '1' },
  ];
  renderOrderItems();
  showToast('Exemplo feliz preenchido. Confira os campos e envie quando quiser.');
}

function orderScenarioPayload(name) {
  const payload = structuredClone(SAMPLE_ORDER);
  if (name === 'inactive') payload.items = [{ productId: PRODUCT_IDS.inactive, quantity: 1 }];
  if (name === 'missing') payload.items = [{ productId: PRODUCT_IDS.missing, quantity: 1 }];
  if (name === 'duplicate') payload.items = [
    { productId: PRODUCT_IDS.keyboard, quantity: 1 },
    { productId: PRODUCT_IDS.keyboard, quantity: 2 },
  ];
  if (name === 'quantity') payload.items[0].quantity = 0;
  if (name === 'customer') payload.customer.name = '';
  if (name === 'extra') payload.unitPrice = 199;
  return payload;
}

function loadOrderScenario() {
  const selected = $('#orderScenario').value;
  $('#rawOrderJson').value = JSON.stringify(orderScenarioPayload(selected), null, 2);
  $('#advancedOrder').open = true;
  showToast('Cenário carregado. Clique em “Enviar JSON” para chamar a API.');
}

function renderCreatedOrder(order, result) {
  const target = $('#orderResult');
  const items = (order.items ?? []).map((item) => `
    <div class="summary-item">
      <span>${escapeHtml(item.quantity)} × ${escapeHtml(item.productName)}<br /><span class="monospace">${escapeHtml(item.sku)} · ${escapeHtml(formatMoney(item.unitPriceCents))} cada</span></span>
      <strong>${escapeHtml(formatMoney(item.lineSubtotalCents))}</strong>
    </div>`).join('');
  const discountApplied = Boolean(order.discount?.applied);
  const discountLabel = discountApplied ? formatMoney(order.discount.amountCents) : 'Não aplicado';

  target.innerHTML = `
    <div class="created-summary">
      <div class="created-topline">
        <div><p class="eyebrow">Resposta HTTP ${escapeHtml(result.status)}</p><h3>Pedido criado</h3></div>
        <span class="badge badge-success">${escapeHtml(order.status || 'CREATED')}</span>
      </div>
      <div class="created-id"><span class="monospace" title="${escapeHtml(order.id)}">${escapeHtml(shortId(order.id))}</span>${copyIdButton(order.id, 'Copiar ID do pedido')}<button class="table-action" type="button" data-view-order="${escapeHtml(order.id)}">Abrir no histórico</button></div>
      <div class="summary-total"><small>Total do pedido · BRL</small><strong>${escapeHtml(formatMoney(order.totalCents))}</strong></div>
      <div class="summary-metrics">
        <div class="summary-metric"><span>Subtotal</span><strong>${escapeHtml(formatMoney(order.subtotalCents))}</strong></div>
        <div class="summary-metric"><span>Desconto</span><strong>${escapeHtml(discountLabel)}</strong></div>
        <div class="summary-metric"><span>Cliente</span><strong>${escapeHtml(order.customer?.name)}</strong></div>
        <div class="summary-metric"><span>Itens distintos</span><strong>${escapeHtml(order.items?.length ?? 0)}</strong></div>
      </div>
      <div class="summary-items">${items}</div>
      <p class="muted-copy">Preços observados em ${escapeHtml(formatDate(order.pricingObservedAt))} · salvo em ${escapeHtml(formatDate(order.createdAt))}</p>
    </div>`;
}

async function submitOrder(payload, button) {
  if (isSubmittingOrder) return;
  isSubmittingOrder = true;
  setButtonLoading(button, true, 'Gravando…');
  const alternateButton = button?.id === 'sendRawOrder' ? $('#createOrderButton') : $('#sendRawOrder');
  setButtonLoading(alternateButton, true, 'Aguarde…');
  const result = await callApi('orders', '/api/v1/orders', { method: 'POST', body: payload });
  setButtonLoading(button, false);
  setButtonLoading(alternateButton, false);
  isSubmittingOrder = false;

  if (!result.ok) {
    renderApiError($('#orderResult'), result);
    if (result.status) showToast(`A API respondeu com HTTP ${result.status}.`, true);
    return;
  }

  if (!result.data?.id || !Array.isArray(result.data.items)) {
    renderApiError($('#orderResult'), { status: 502, data: { title: 'Resposta inesperada de Pedidos', detail: 'O serviço respondeu sem os dados do pedido criado.' } });
    return;
  }

  renderCreatedOrder(result.data, result);
  showToast('Pedido gravado no PostgreSQL.');
  await loadOrders();
  renderLastRequest(result);
}

async function submitOrderForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  if (orderItems.length < 1 || orderItems.length > 100) {
    showToast('O pedido deve ter entre 1 e 100 itens.', true);
    return;
  }

  const items = [];
  for (const [index, item] of orderItems.entries()) {
    const row = $(`[data-item-index="${index}"]`, $('#orderItems'));
    const selected = $('[data-item-product]', row).value;
    const productId = selected === '__manual__' ? $('[data-item-manual-id]', row).value.trim() : selected;
    const quantity = Number($('[data-item-quantity]', row).value);
    if (!productId) {
      showToast(`Selecione ou informe o UUID do item ${index + 1}.`, true);
      return;
    }
    items.push({ productId, quantity });
  }

  const payload = {
    customer: { name: $('#customerName').value, email: $('#customerEmail').value },
    items,
  };
  await submitOrder(payload, $('#createOrderButton'));
}

async function submitRawOrder() {
  const button = $('#sendRawOrder');
  let payload;
  try {
    payload = JSON.parse($('#rawOrderJson').value);
  } catch {
    renderApiError($('#orderResult'), { ok: false, data: { title: 'JSON inválido', detail: 'Revise a estrutura do corpo antes de enviar.' } });
    $('#rawOrderJson').focus();
    return;
  }
  await submitOrder(payload, button);
}

function renderOrders(data, meta) {
  const body = $('#ordersBody');
  if (!data.length) {
    body.innerHTML = '<tr><td colspan="8" class="table-message">Nenhum pedido nesta página. Crie um pedido acima para começar.</td></tr>';
  } else {
    body.innerHTML = data.map((order) => `
      <tr data-order-id="${escapeHtml(order.id)}" class="${order.id === selectedOrderId ? 'order-row-selected' : ''}">
        <td><span class="id-copy-row order-id-copy-row"><span class="monospace" title="${escapeHtml(order.id)}">${escapeHtml(shortId(order.id))}</span>${copyIdButton(order.id, 'Copiar ID do pedido')}</span></td>
        <td><strong>${escapeHtml(order.customer?.name)}</strong></td>
        <td>${escapeHtml(order.itemCount)}</td>
        <td>${escapeHtml(formatMoney(order.subtotalCents))}</td>
        <td>${escapeHtml(formatMoney(order.discountAmountCents))}</td>
        <td><strong>${escapeHtml(formatMoney(order.totalCents))}</strong></td>
        <td>${escapeHtml(formatDate(order.createdAt))}</td>
        <td><button class="table-action" type="button" data-view-order="${escapeHtml(order.id)}">Detalhes</button></td>
      </tr>`).join('');
  }

  const paginationLabel = meta.totalPages ? `página ${meta.page} de ${meta.totalPages}` : 'sem páginas';
  $('#orderMeta').textContent = `${meta.totalItems} ${meta.totalItems === 1 ? 'pedido' : 'pedidos'} · ${paginationLabel}`;
  $('#orderPage').value = String(meta.page);
  $('#orderPageSize').value = String(meta.pageSize);
  $('#ordersNotice').textContent = '';
}

async function loadOrders() {
  if (isLoadingOrders) return;
  isLoadingOrders = true;
  const button = $('#searchOrders');
  const reloadButton = $('#reloadOrders');
  setButtonsLoading([button, reloadButton], true, 'Buscando…');
  const page = $('#orderPage').value.trim() || '1';
  const pageSize = $('#orderPageSize').value.trim() || '20';
  $('#ordersTable').setAttribute('aria-busy', 'true');
  $('#orderMeta').textContent = 'Buscando pedidos…';
  try {
    const result = await callApi('orders', `/api/v1/orders?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`);
    const pageData = result.data;
    const meta = pageData?.meta;
    if (!result.ok || !Array.isArray(pageData?.data) || !meta || !Number.isInteger(meta.page) || !Number.isInteger(meta.pageSize) || !Number.isInteger(meta.totalItems) || !Number.isInteger(meta.totalPages)) {
      $('#orderMeta').textContent = orders.length ? 'Falha ao atualizar; a listagem anterior continua visível.' : 'O histórico não pôde ser carregado.';
      if (!orders.length) {
        $('#ordersBody').innerHTML = '<tr><td colspan="8" class="table-message">Confira o estado de Pedidos e tente novamente.</td></tr>';
      }
      $('#ordersNotice').textContent = result.data?.detail || result.data?.title || 'Erro ao listar pedidos.';
      return;
    }

    orders = pageData.data;
    renderOrders(orders, meta);
  } finally {
    $('#ordersTable').setAttribute('aria-busy', 'false');
    setButtonsLoading([button, reloadButton], false);
    isLoadingOrders = false;
  }
}

function renderOrderDetail(order) {
  const items = (order.items ?? []).map((item) => `
    <div class="detail-line">
      <span>${escapeHtml(item.lineNumber)}. ${escapeHtml(item.productName)}<br /><span class="monospace">${escapeHtml(item.sku)} · ${escapeHtml(item.quantity)} × ${escapeHtml(formatMoney(item.unitPriceCents))}</span></span>
      <span>${escapeHtml(formatMoney(item.lineSubtotalCents))}</span>
    </div>`).join('');
  const discount = order.discount?.applied ? formatMoney(order.discount.amountCents) : 'Não aplicado';
  const target = $('#orderDetail');
  target.innerHTML = `
    <div class="created-topline">
      <div><p class="eyebrow">Snapshot persistido · ${escapeHtml(order.status)}</p><h3>${escapeHtml(order.customer?.name)}</h3></div>
      <span class="badge badge-success">Encontrado</span>
    </div>
    <div class="id-copy-row detail-id"><span class="monospace" title="${escapeHtml(order.id)}">${escapeHtml(shortId(order.id))}</span>${copyIdButton(order.id, 'Copiar ID do pedido')}</div>
    <p class="muted-copy">${escapeHtml(order.customer?.email)}</p>
    <div class="detail-total"><span>Total salvo</span><strong>${escapeHtml(formatMoney(order.totalCents))}</strong></div>
    <div class="detail-block"><h4>Valores</h4><div class="detail-line"><span>Subtotal</span><span>${escapeHtml(formatMoney(order.subtotalCents))}</span></div><div class="detail-line"><span>Desconto</span><span>${escapeHtml(discount)}</span></div><div class="detail-line"><span>Regra registrada</span><span>${escapeHtml(order.discount?.policy?.ruleId || '—')}</span></div></div>
    <div class="detail-block"><h4>Itens · fotografia do Catálogo</h4>${items}</div>
    <div class="detail-block"><div class="detail-line"><span>Preços observados</span><span>${escapeHtml(formatDate(order.pricingObservedAt))}</span></div><div class="detail-line"><span>Pedido criado</span><span>${escapeHtml(formatDate(order.createdAt))}</span></div></div>`;
}

async function lookupOrder(orderId) {
  const value = orderId.trim();
  if (isLookingUpOrder) return;
  if (!value) {
    selectedOrderId = '';
    $$('.order-row-selected', $('#ordersBody')).forEach((row) => row.classList.remove('order-row-selected'));
    $('#orderDetail').innerHTML = '<div class="api-error-card"><strong>Informe um UUID</strong><p>Cole o identificador retornado na criação do pedido.</p></div>';
    $('#orderLookupId').focus();
    return;
  }

  isLookingUpOrder = true;
  const target = $('#orderDetail');
  const button = $('#orderLookupForm button[type="submit"]');
  target.setAttribute('aria-busy', 'true');
  target.innerHTML = '<p class="muted-copy">Buscando o pedido no histórico…</p>';
  $$('.order-row-selected', $('#ordersBody')).forEach((row) => row.classList.remove('order-row-selected'));
  setButtonLoading(button, true, 'Buscando…');
  try {
    const result = await callApi('orders', `/api/v1/orders/${encodeURIComponent(value)}`);
    if (!result.ok) {
      selectedOrderId = '';
      renderApiError(target, result);
      return;
    }
    if (!result.data?.id || !Array.isArray(result.data.items)) {
      selectedOrderId = '';
      renderApiError(target, { status: 502, data: { title: 'Resposta inesperada de Pedidos', detail: 'A consulta não retornou os dados históricos esperados.' } });
      return;
    }
    selectedOrderId = result.data.id;
    $$('[data-order-id]', $('#ordersBody')).forEach((row) => {
      row.classList.toggle('order-row-selected', row.dataset.orderId === selectedOrderId);
    });
    renderOrderDetail(result.data);
    showToast('Pedido histórico carregado.');
  } finally {
    target.setAttribute('aria-busy', 'false');
    setButtonLoading(button, false);
    isLookingUpOrder = false;
  }
}

function scenarioOrderClick(orderId) {
  $('#orderLookupId').value = orderId;
  void lookupOrder(orderId);
  document.querySelector('#orderDetail').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function copyId(value) {
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    let copyField;
    try {
      copyField = document.createElement('textarea');
      copyField.value = value;
      copyField.setAttribute('readonly', '');
      copyField.className = 'copy-fallback-field';
      document.body.append(copyField);
      copyField.select();
      copied = document.execCommand?.('copy') ?? false;
    } catch {
      copied = false;
    } finally {
      copyField?.remove();
    }
  }

  if (copied) {
    showToast('UUID copiado.');
    return;
  }

  const dialog = $('#copyFallbackDialog');
  const field = $('#copyFallbackValue');
  if (typeof dialog.showModal !== 'function') {
    showToast('Não foi possível copiar o UUID neste navegador.', true);
    return;
  }
  field.value = value;
  dialog.showModal();
  field.focus();
  field.select();
}

$('#refreshHealth').addEventListener('click', () => void refreshHealth());
$('#reloadProducts').addEventListener('click', () => void loadProducts());
$('#reloadOrders').addEventListener('click', () => void loadOrders());
$('#productPaginationForm').addEventListener('submit', (event) => {
  event.preventDefault();
  void loadProducts();
});
$('#ordersPaginationForm').addEventListener('submit', (event) => {
  event.preventDefault();
  void loadOrders();
});
$('#productLookupForm').addEventListener('submit', (event) => {
  event.preventDefault();
  void lookupProduct($('#productLookupId').value, $('#productLookupForm button[type="submit"]'));
});
$('#batchForm').addEventListener('submit', (event) => void queryBatch(event));
$('#fillBatchExample').addEventListener('click', fillBatchExample);
$('#fillOrderExample').addEventListener('click', fillCanonicalOrder);
$('#addOrderItem').addEventListener('click', () => {
  if (orderItems.length >= 100) {
    showToast('O contrato aceita até 100 itens distintos.', true);
    return;
  }
  orderItems.push({ productId: '', manualId: '', quantity: '1' });
  renderOrderItems();
  $(`[data-item-index="${orderItems.length - 1}"] [data-item-product]`).focus();
});
$('#orderItems').addEventListener('change', (event) => {
  const row = event.target.closest('[data-item-index]');
  if (!row) return;
  const index = Number(row.dataset.itemIndex);
  if (event.target.matches('[data-item-product]')) {
    const value = event.target.value;
    orderItems[index].manualId = value === '__manual__' ? orderItems[index].manualId : '';
    orderItems[index].productId = value === '__manual__' ? '' : value;
    renderOrderItems();
    if (value === '__manual__') $(`[data-item-index="${index}"] [data-item-manual-id]`).focus();
  }
  if (event.target.matches('[data-item-quantity]')) orderItems[index].quantity = event.target.value;
  if (event.target.matches('[data-item-manual-id]')) orderItems[index].manualId = event.target.value;
});
$('#orderItems').addEventListener('input', (event) => {
  const row = event.target.closest('[data-item-index]');
  if (!row) return;
  const index = Number(row.dataset.itemIndex);
  if (event.target.matches('[data-item-quantity]')) orderItems[index].quantity = event.target.value;
  if (event.target.matches('[data-item-manual-id]')) orderItems[index].manualId = event.target.value;
});
$('#orderItems').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-item]');
  if (!button || button.disabled) return;
  orderItems.splice(Number(button.dataset.removeItem), 1);
  renderOrderItems();
});
$('#orderForm').addEventListener('submit', (event) => void submitOrderForm(event));
$('#loadOrderScenario').addEventListener('click', loadOrderScenario);
$('#sendRawOrder').addEventListener('click', () => void submitRawOrder());
$('#orderLookupForm').addEventListener('submit', (event) => {
  event.preventDefault();
  void lookupOrder($('#orderLookupId').value);
});
$('#productsBody').addEventListener('click', (event) => {
  const button = event.target.closest('[data-lookup-product]');
  if (!button) return;
  $('#productLookupId').value = button.dataset.lookupProduct;
  void lookupProduct(button.dataset.lookupProduct, $('#productLookupForm button[type="submit"]'));
});
$('#ordersBody').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view-order]');
  if (button) scenarioOrderClick(button.dataset.viewOrder);
});
$('#orderResult').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view-order]');
  if (button) scenarioOrderClick(button.dataset.viewOrder);
});
document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('[data-copy-id]');
  if (copyButton) void copyId(copyButton.dataset.copyId);
});
$('#closeCopyFallback').addEventListener('click', () => $('#copyFallbackDialog').close());

renderOrderItems();
void refreshHealth();
void loadProducts();
void loadOrders();
