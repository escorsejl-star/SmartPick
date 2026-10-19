# SmartPick.Graphs

Serviço de grafos e rotas do SmartPick (Equipe 2). Nesta Sprint 1 ele ainda é um protótipo em Python, e na Sprint 2 vira o serviço FastAPI.

Este arquivo vai na pasta `src/SmartPick.Graphs/` do repositório.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `dados/grafo_armazem.json` | Vértices, arestas (com distância e tipo de acesso) e prateleiras do armazém de exemplo |
| `prototipo_rota.py` | Monta os dois grafos (manual e empilhadeira) e calcula o menor caminho |
| `test_prototipo.py` | Testes do protótipo |
| `desenhar_grafo.py` | Gera o desenho do grafo em `docs/grafo_armazem.png` |
| `docs/grafo_armazem.png` | Desenho do grafo (entrega da Semana 1) |
| `docs/estudo_dijkstra.md` | Guia de estudo (Semana 2) |
| `docs/regras_de_negocio.md` | Regras, penalidades e contrato de dados (Semana 3) |
| `requirements.txt` | Dependências do Python |

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
python prototipo_rota.py
python test_prototipo.py
```

Para gerar o desenho: `pip install matplotlib` e depois `python desenhar_grafo.py`.

## Checklist da Sprint 1 (Equipe 2)

### Semana 1: o armazém como grafo
- [ ] Combinar o layout com a Equipe 1 (veja as perguntas em `docs/regras_de_negocio.md`, seção 5)
- [ ] Definir os vértices (corredores, entrada e saída) e as arestas com distâncias
- [ ] Marcar quais arestas são só de acesso manual
- [ ] Ligar cada prateleira a um corredor (campo `prateleiras` do JSON)
- [ ] Conferir o desenho `docs/grafo_armazem.png` com a Equipe 1

### Semana 2: estudo e protótipo
- [ ] Ler `docs/estudo_dijkstra.md` e fazer os exercícios do final
- [ ] Rodar `prototipo_rota.py` e entender cada função
- [ ] Rodar `test_prototipo.py`
- [ ] Trocar o grafo de exemplo pelo grafo real, se o layout já estiver definido
- [ ] Cada integrante explica o Dijkstra para o grupo com suas palavras

### Semana 3: formato JSON e regras
- [ ] Fechar o formato do `grafo_armazem.json` com o grupo
- [ ] Fechar as regras e os valores de `docs/regras_de_negocio.md` (os marcados como "a confirmar")
- [ ] Levar o contrato de dados (seção 4) para a reunião de integração com as Equipes 1 e 3

## O que entregar no fim da sprint
- Desenho do grafo (`docs/grafo_armazem.png`)
- Protótipo em Python funcionando, com o JSON do grafo
- Documento das regras de negócio

## Sugestão de commits

Trabalhem em uma branch como `equipe2/prototipo-grafo` e abram um Pull Request no fim.

```
docs: adiciona desenho do grafo do armazém
feat: cria arquivo JSON do grafo do armazém
feat: adiciona protótipo de rota com NetworkX
feat: adiciona Dijkstra didático para estudo
test: adiciona testes do protótipo de rotas
docs: adiciona guia de estudo de Dijkstra
docs: define regras de negócio e critérios de pontuação
```

Comandos básicos para cada commit:

```bash
git checkout -b equipe2/prototipo-grafo
git add dados/grafo_armazem.json
git commit -m "feat: cria arquivo JSON do grafo do armazém"
git push -u origin equipe2/prototipo-grafo
```

Se algum teste falhar depois de mudar o JSON, rode `python test_prototipo.py`. Se a mudança for proposital (por exemplo, o grafo real tem outras distâncias), atualizem os valores do dicionário `ESPERADO` no teste.
