# SmartPick.Graphs

Serviço de grafos e rotas do SmartPick. Ele representa o armazém como um grafo e calcula o menor caminho entre a entrada e as posições, separando o acesso do operador a pé (manual) do acesso da empilhadeira. Também recomenda a posição de armazenamento de uma caixa e expõe tudo em uma API com FastAPI.

O layout segue o front-end: 6 corredores (A a F), 10 posições por corredor e 5 níveis de prateleira (P1 a P5).

## Estrutura

| Arquivo | Descrição |
|---|---|
| `dados/grafo_armazem.json` | Vértices e arestas (distância e tipo de acesso) do armazém de exemplo |
| `gerar_grafo.py` | Gera o JSON a partir dos parâmetros do layout (corredores, distâncias, corredores da empilhadeira) |
| `prototipo_rota.py` | Monta os grafos manual e empilhadeira e calcula o menor caminho (NetworkX e Dijkstra escrito à mão) |
| `recomendacao.py` | Escolha da posição: filtra, calcula a rota e soma as penalidades |
| `coleta.py` | Rota que passa por várias paradas (tela do mapa) |
| `main.py` | API FastAPI |
| `test_prototipo.py`, `test_recomendacao.py`, `test_coleta.py`, `test_api.py` | Testes |
| `desenhar_grafo.py` | Gera o desenho do grafo em `docs/grafo_armazem.png` |
| `docs/guia_integracao.md` | Guia da API para as Equipes 1 e 3, com exemplos em JavaScript e C# |
| `docs/regras_de_negocio.md` | Regras, penalidades e perguntas em aberto |
| `docs/estudo_dijkstra.md` | Anotações sobre grafos e Dijkstra |
| `requirements.txt` | Dependências do Python |

## Como rodar

```bash
python -m venv .venv
source .venv/bin/activate        # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
python prototipo_rota.py
```

Para gerar o desenho do grafo: `pip install matplotlib` e depois `python desenhar_grafo.py`.

## API

Para subir a API (com o ambiente virtual ativado):

```bash
python -m uvicorn main:app --reload --port 8001
```

Abra http://127.0.0.1:8001/docs para testar os endpoints no navegador.

| Endpoint | Função |
|---|---|
| `GET /saude` | Confere se o serviço está no ar |
| `GET /armazem` | Layout do grafo e valores atuais das regras |
| `GET /rota?origem=Entrada&destino=C-05&tipo=manual` | Menor caminho entre dois pontos (`tipo` = `manual` ou `empilhadeira`) |
| `POST /rota/paradas` | Rota que passa por várias paradas, com opção de reordená-las |
| `POST /recomendar` | Escolhe a melhor posição entre as livres e devolve endereço, acesso, rota e custo |

Os formatos de pedido e resposta, os erros e os exemplos em JavaScript e C# estão em `docs/guia_integracao.md`.

O CORS está liberado por padrão. Os valores de peso e penalidades ficam no começo do `recomendacao.py`.

## Dados do grafo

O arquivo `dados/grafo_armazem.json` tem estas partes:

- `corredores`, `posicoesPorCorredor` e `niveis`: o tamanho do armazém.
- `vertices`: a entrada, a saída e uma posição por corredor e número (`A01` a `F10`).
- `arestas`: ligações entre dois vértices, com `distancia` (em metros) e `acesso` (`manual`, `empilhadeira` ou os dois).

Os grafos são montados a partir do campo `acesso`:

- **Manual:** usa todas as arestas.
- **Empilhadeira:** usa só as arestas que incluem `empilhadeira` (no exemplo, os corredores C e E, os transversais e as ligações da entrada e da saída).

O menor caminho é calculado com Dijkstra, usando a distância como peso. O peso da caixa não entra no grafo: ele é usado na escolha da posição (veja `docs/regras_de_negocio.md`).

As distâncias e o layout são exemplos e serão ajustados com o layout real do armazém. Para mudar o armazém, altere as constantes do `gerar_grafo.py` e rode `python gerar_grafo.py`.

## Testes

```bash
python test_prototipo.py
python test_recomendacao.py
python test_coleta.py
python test_api.py
```

Se o grafo mudar de propósito (por exemplo, com as distâncias reais), atualize os valores esperados nos testes.

## Status

- [x] Grafo do armazém em JSON, no layout do front-end
- [x] Cálculo de rotas (manual e empilhadeira)
- [x] Escolha da posição por peso, nível e acesso
- [x] Rota por várias paradas
- [x] API FastAPI com CORS e guia de integração
- [x] Testes automáticos e desenho do grafo
- [ ] Validar o layout real com a Equipe 1
- [ ] Fechar os valores das regras de negócio
- [ ] Integrar a API em C# e o front-end ao serviço
