# SmartPick.Graphs

Serviço de grafos e rotas do SmartPick. Ele representa o armazém como um grafo e calcula o menor caminho entre a entrada e cada prateleira, separando o acesso do operador a pé (manual) do acesso da empilhadeira.

Na Sprint 1 este módulo é um protótipo em Python com NetworkX. Na Sprint 2 ele será exposto como uma API com FastAPI.

## Estrutura

| Arquivo | Descrição |
|---|---|
| `dados/grafo_armazem.json` | Vértices, arestas (distância e tipo de acesso) e prateleiras do armazém de exemplo |
| `prototipo_rota.py` | Monta os grafos manual e empilhadeira e calcula o menor caminho |
| `test_prototipo.py` | Testes do protótipo |
| `desenhar_grafo.py` | Gera o desenho do grafo em `docs/grafo_armazem.png` |
| `docs/grafo_armazem.png` | Desenho do grafo do armazém |
| `docs/estudo_dijkstra.md` | Anotações de estudo sobre grafos e Dijkstra |
| `docs/regras_de_negocio.md` | Regras de negócio, critérios de escolha da posição e contrato de dados (rascunho) |
| `requirements.txt` | Dependências do Python |

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
python prototipo_rota.py
python test_prototipo.py
```

Para gerar o desenho do grafo: `pip install matplotlib` e depois `python desenhar_grafo.py`.

## Dados do grafo

O arquivo `dados/grafo_armazem.json` tem três partes:

- `vertices`: corredores, entrada e saída.
- `arestas`: ligações entre dois vértices, com `distancia` (em metros) e `acesso` (`manual`, `empilhadeira` ou os dois).
- `prateleiras`: o corredor de onde cada prateleira é acessada.

Os grafos são montados a partir do campo `acesso`:

- **Manual:** usa todas as arestas.
- **Empilhadeira:** usa só as arestas que incluem `empilhadeira`, ou seja, não passa pelas passagens estreitas.

O menor caminho é calculado com Dijkstra, usando a distância como peso de cada aresta. O peso da caixa não entra no grafo: ele é usado na escolha da posição (veja `docs/regras_de_negocio.md`).

As distâncias e o layout são exemplos e serão ajustados com o layout real do armazém.

## Testes

```bash
python test_prototipo.py
```

Se o grafo mudar de propósito (por exemplo, com as distâncias reais), atualize os valores do dicionário `ESPERADO` em `test_prototipo.py`.

## Status da Sprint 1

- [x] Grafo do armazém em JSON
- [x] Protótipo de cálculo de rotas (manual e empilhadeira)
- [x] Testes do protótipo
- [x] Desenho do grafo
- [x] Anotações de estudo sobre Dijkstra
- [x] Rascunho das regras de negócio
- [ ] Validar o layout real com a Equipe 1
- [ ] Fechar os valores das regras de negócio
- [ ] Fechar o formato dos dados com as Equipes 1 e 3

## Próximos passos (Sprint 2)

- Criar o serviço FastAPI com os endpoints `GET /rota` e `POST /recomendar`.
- Integrar com a API em C#, que fornece as posições livres.
