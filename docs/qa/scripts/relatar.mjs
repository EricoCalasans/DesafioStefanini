import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const qa = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(join(qa, 'execucao.json'), 'utf8'));
const totals = { PASSOU: 0, FALHOU: 0, BLOQUEADO: 0, 'NÃO EXECUTADO': 0 };
const lines = ['# Resultados por caso', '', 'Fonte: [execucao.json](execucao.json). Datas UTC; ambiente `desafio-qa-20261022`. As falhas anteriores continuam no histórico após um reteste aprovado.', ''];
for (const [id, test] of Object.entries(data.cases)) {
  totals[test.status]++;
  lines.push(`## ${id} — ${test.title}`, '', `**Estado final:** ${test.status}. **Esperado:** ${test.expected}`, '');
  if (!test.attempts.length) lines.push('Sem tentativa registrada.', '');
  for (let i = 0; i < test.attempts.length; i++) {
    const attempt = test.attempts[i];
    lines.push(`### Tentativa ${i + 1}: ${attempt.status}`, '', `${attempt.startedAt} a ${attempt.finishedAt}. Ambiente: ${attempt.environment}.`, '', `**Observado:** ${attempt.observed.replace(/\n/g, ' ')}`, '');
    const http = attempt.evidence.filter(e => e.service);
    if (http.length) {
      lines.push('| API | Método e caminho | HTTP esperado/real | ms |', '|---|---|---|---|');
      for (const e of http) lines.push(`| ${e.service} | ${e.method} ${e.path} | ${e.expectedStatus}/${e.actualStatus} | ${e.durationMs} |`);
      lines.push('');
    }
    for (const e of attempt.evidence.filter(e => e.command)) lines.push(`- \`${e.command}\`: exit ${e.exitCode}, ${e.durationMs} ms. [Log](${e.log}).`);
    lines.push('');
    for (const e of attempt.evidence.filter(e => !e.service && !e.command)) lines.push(`Evidência: \`${JSON.stringify(e)}\``, '');
  }
}
const summary = `Planejados: ${Object.keys(data.cases).length}; executados com tentativa: ${Object.values(data.cases).filter(t => t.attempts.length).length}; PASSOU: ${totals.PASSOU}; FALHOU: ${totals.FALHOU}; BLOQUEADO: ${totals.BLOQUEADO}; NÃO EXECUTADO: ${totals['NÃO EXECUTADO']}.`;
lines.splice(4, 0, summary, '');
await writeFile(join(qa, 'resultados.md'), lines.join('\n'));
console.log(summary);
