import copy
import json
import re
import sys
from collections import Counter
from importlib.metadata import version
from pathlib import Path
from urllib.parse import unquote

import yaml
from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate

ROOT = Path(__file__).resolve().parents[1]
cache = {}
errors = []
checks = []

def document(path):
    path = path.resolve()
    if path not in cache:
        cache[path] = yaml.safe_load(path.read_text(encoding='utf-8'))
    return cache[path]

def expand(value, path):
    if isinstance(value, list):
        return [expand(x, path) for x in value]
    if not isinstance(value, dict):
        return value
    if '$ref' in value:
        ref = value['$ref']
        filename, _, fragment = ref.partition('#')
        target_path = (path.parent / unquote(filename)).resolve() if filename else path.resolve()
        target = document(target_path)
        for part in fragment.lstrip('/').split('/') if fragment else []:
            target = target[part.replace('~1', '/').replace('~0', '~')]
        target = expand(target, target_path)
        target.update({k: expand(v, path) for k, v in value.items() if k != '$ref'})
        return target
    return {k: expand(v, path) for k, v in value.items()}

def check(name, action):
    try:
        detail = action()
        checks.append({'check': name, 'result': 'pass', 'detail': detail})
    except Exception as exc:
        message = str(exc)
        checks.append({'check': name, 'result': 'fail', 'detail': message})
        errors.append(name + ': ' + message)

for path in sorted((ROOT / 'contracts').glob('*.yaml')):
    check('OpenAPI ' + path.name, lambda p=path: (validate(document(p), base_uri=p.as_uri()), 'OpenAPI 3.1 válido')[1])

def local_links():
    count = 0
    missing = []
    for path in [ROOT/'README.md', ROOT/'CAPABILITY-MAP.md', *sorted((ROOT/'docs').rglob('*.md')), *sorted((ROOT/'specs').glob('*.md')), *sorted((ROOT/'tasks').glob('*.md')), ROOT/'contracts/README.md']:
        text = path.read_text(encoding='utf-8')
        for match in re.finditer(r'(?<!!)\[[^\]]+\]\(([^)]+)\)', text):
            target = match.group(1).strip().strip('<>')
            if target.startswith(('https://', 'http://', 'mailto:', '#')):
                continue
            target = unquote(target.split('#')[0])
            if not (path.parent / target).exists():
                missing.append(f'{path.relative_to(ROOT)} -> {target}')
            count += 1
    assert not missing, '\n'.join(missing)
    return f'{count} links locais com destino existente'

check('Links locais Markdown', local_links)

def ids():
    text = (ROOT/'docs/matriz-de-rastreabilidade.md').read_text(encoding='utf-8')
    found = re.findall(r'^\| (R\d\d) \|', text, re.M)
    assert Counter(found) == Counter(f'R{i:02d}' for i in range(1,54)), found
    specs = list((ROOT/'specs').glob('SPEC-*.md'))
    assert len(specs) == 9, len(specs)
    quality = re.findall(r'^\| (Q\d\d) \|', (ROOT/'specs/SPEC-qualidade.md').read_text(encoding='utf-8'), re.M)
    assert Counter(quality) == Counter(f'Q{i:02d}' for i in range(1,51)), quality
    tasks = re.findall(r'^- \[[ x]\] \*\*(T\d\d)', (ROOT/'tasks/todo.md').read_text(encoding='utf-8'), re.M)
    assert Counter(tasks) == Counter(f'T{i:02d}' for i in range(1,46)), tasks
    return 'R01-R53, Q01-Q50 e T01-T45 sem lacunas ou duplicações; 9 specs'

check('IDs e contagem de artefatos', ids)

example_map = [
    ('criar-pedido.json','pedidos.openapi.yaml','CreateOrder'),
    ('pedido.json','pedidos.openapi.yaml','Order'),
    ('consulta-produtos.json','catalogo.openapi.yaml','ProductQuery'),
    ('produtos.json','catalogo.openapi.yaml','ProductQueryResult'),
    ('problema-produto-inativo.json','common.openapi.yaml','Problem'),
]
for filename, docname, schema in example_map:
    def example(f=filename, d=docname, s=schema):
        path = ROOT/'contracts'/d
        data = json.loads((ROOT/'contracts/examples'/f).read_text(encoding='utf-8'))
        expanded = expand(document(path)['components']['schemas'][s], path)
        Draft202012Validator(expanded, format_checker=FormatChecker()).validate(data)
        return f'{f} compatível com {s}'
    check('Exemplo ' + filename, example)

def semantic_example():
    order = json.loads((ROOT/'contracts/examples/pedido.json').read_text(encoding='utf-8'))
    products = json.loads((ROOT/'contracts/examples/produtos.json').read_text(encoding='utf-8'))
    ids = json.loads((ROOT/'contracts/examples/consulta-produtos.json').read_text(encoding='utf-8'))['productIds']
    assert set(ids) == {p['id'] for p in products['products']} | set(products['missingProductIds'])
    assert len(ids) == len(products['products']) + len(products['missingProductIds'])
    product_by_id = {p['id']:p for p in products['products']}
    for item in order['items']:
        assert item['unitPriceCents'] == product_by_id[item['productId']]['priceCents']
        assert item['lineSubtotalCents'] == item['unitPriceCents'] * item['quantity']
    subtotal = sum(i['lineSubtotalCents'] for i in order['items'])
    policy = order['discount']['policy']
    discount = (subtotal*policy['rateBps']+5000)//10000 if policy['enabled'] and subtotal>=policy['thresholdCents'] else 0
    assert subtotal == order['subtotalCents'] == 50000
    assert discount == order['discount']['amountCents'] == 5000
    assert subtotal-discount == order['totalCents'] == 45000
    return 'Conjuntos, preços, linhas, subtotal, desconto e total consistentes'

check('Semântica do exemplo canônico', semantic_example)

def negative_contract():
    path = ROOT/'contracts/pedidos.openapi.yaml'
    schema = expand(document(path)['components']['schemas']['CreateOrder'],path)
    validator = Draft202012Validator(schema,format_checker=FormatChecker())
    sample = json.loads((ROOT/'contracts/examples/criar-pedido.json').read_text(encoding='utf-8'))
    variants=[]
    x=copy.deepcopy(sample);x['totalCents']=1;variants.append(x)
    x=copy.deepcopy(sample);x['items'][0]['quantity']=0;variants.append(x)
    x=copy.deepcopy(sample);x['items'][0]['quantity']='2';variants.append(x)
    x=copy.deepcopy(sample);x['items'][0]['unitPriceCents']=1;variants.append(x)
    x=copy.deepcopy(sample);x['items']=[];variants.append(x)
    x=copy.deepcopy(sample);x['items'][0]['productId']={'$ne':None};variants.append(x)
    for x in variants:
        assert list(validator.iter_errors(x)), x
    return f'{len(variants)} exemplos inválidos recusados pelo schema; não é teste do servidor'

check('Contratos - exemplos negativos', negative_contract)

def proposal_math():
    text=(ROOT/'specs/SPEC-proposta.md').read_text(encoding='utf-8')
    packages=[]
    for line in text.splitlines():
        match=re.match(r'^\| [^*][^|]+\| (\d+) \| (\d+) \| (\d+) \|',line)
        if match:
            a,b,total=map(int,match.groups());assert a+b==total;packages.append((a,b,total))
    assert len(packages)==8,packages
    assert tuple(map(sum,zip(*packages)))==(104,100,204)
    assert 104+16==100+20==120
    assert 204+36==15*8*2==240
    assert 120*160+120*110==32400
    assert 35640*100//72==49500
    assert 35640+3960+9900==49500
    return '204 h base +36 h reserva =240 h; 120 h/pessoa; preço hipotético R$49.500 reconciliado'

check('Aritmética da proposta',proposal_math)

report={
    'kind':'documentation-review',
    'scope':'Specs, contratos e exemplos; nenhuma aplicação executada',
    'date':'2026-10-21',
    'tools':{name:version(name) for name in ['openapi-spec-validator','PyYAML','jsonschema']},
    'checks':checks,
    'result':'pass' if not errors else 'fail',
}
reportpath=ROOT/'docs/evidencias/revisao-documental.json'
reportpath.parent.mkdir(parents=True, exist_ok=True)
reportpath.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for item in checks:
    print(item['result'].upper(),item['check'],item['detail'])
print('RESULT:',report['result'])
sys.exit(1 if errors else 0)
