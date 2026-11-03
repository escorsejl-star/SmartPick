# SmartPick.Graphs

Serviço de grafos e rotas do SmartPick. Ele representa o armazém como um grafo e calcula o menor caminho entre a entrada e cada prateleira, separando o acesso do operador a pé (manual) do acesso da empilhadeira.

O módulo tem o protótipo de rotas em Python com NetworkX e uma API com FastAPI, que expõe o cálculo de rotas e a recomendação de posição.

## Estrutura

| Arquivo | Descrição |
|---|---|
| `dados/grafo_armazem.json` | Vértices, arestas (distância e tipo de acesso) e prateleiras do armazém de exemplo |
| `prototipo_rota.py` | Monta os grafos manual e empilhadeira e calcula o menor caminho |
| `recomendacao.py` | Escolha da posição: filtra, calcula a rota e soma as penalidades |
| `main.py` | API FastAPI com os endpoints `/rota`, `/recomendar` e `/saude` |
| `test_prototipo.py` | Testes do cálculo de rotas |
| `test_recomendacao.py` | Testes da escolha da posição |
| `test_api.py` | Testes dos endpoints da API |
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
python test_recomendacao.py
python test_api.py
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

## API

Para subir a API (com o ambiente virtual ativado):

```bash
uvicorn main:app --reload
```

Abra http://127.0.0.1:8000/docs para testar os endpoints no navegador.

| Endpoint | Função |
|---|---|
| `GET /saude` | Confere se o serviço está no ar |
| `GET /rota?origem=Entrada&destino=T1&tipo=manual` | Menor caminho entre dois vértices (`tipo` = `manual` ou `empilhadeira`) |
| `POST /recomendar` | Escolhe a melhor posição entre as livres e devolve o acesso, a rota e o custo |

Exemplo de pedido ao `POST /recomendar`:

```json
{
  "pesoKg": 8,
  "posicoesDisponiveis": [
    { "id": 1, "prateleira": "P4", "nivel": 1 },
    { "id": 2, "prateleira": "P4", "nivel": 2 },
    { "id": 3, "prateleira": "P4", "nivel": 3 }
  ]
}
```

Resposta:

```json
{
  "posicaoId": 2,
  "prateleira": "P4",
  "nivel": 2,
  "tipoAcesso": "manual",
  "distancia": 12,
  "custo": 14,
  "rota": ["Entrada", "L3", "B1"]
}
```

Se nenhuma posição servir, a resposta é `{"posicaoId": null, "mensagem": "Nenhuma posição disponível para esta caixa"}`.

Os valores de peso e penalidades ficam no começo do `recomendacao.py` e podem ser ajustados.

## Testes

```bash
python test_prototipo.py
python test_recomendacao.py
python test_api.py
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

## Próximos passos

- Conectar a API em C#, que fornece as posições livres, ao `POST /recomendar`.
- Atualizar o grafo com o layout real do armazém.
- Fechar os valores de peso e penalidades com o grupo.
