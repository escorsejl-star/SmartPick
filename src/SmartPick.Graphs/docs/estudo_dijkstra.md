# Grafos e Dijkstra: anotações da Equipe 2

Anotações sobre o algoritmo usado no módulo de rotas, com exemplos do grafo do próprio SmartPick (`dados/grafo_armazem.json`).

## 1. O que é um grafo

Um grafo é um conjunto de **vértices** (pontos) ligados por **arestas** (linhas).

No SmartPick:
- cada **corredor** (ou ponto de passagem) é um vértice: `L1`, `T1`, `M1`, `Entrada`, `Saida` e assim por diante;
- cada **ligação** entre dois corredores é uma aresta.

As ligações do armazém funcionam nos dois sentidos, então o grafo é **não direcionado** (`nx.Graph` no NetworkX).

## 2. O que é o peso de uma aresta

O peso é o "custo" de usar aquela ligação. No SmartPick, o peso é a **distância em metros**.

Exemplo: a aresta `L3 - B1` pesa 8, ou seja, andar de `L3` até `B1` são 8 metros.

Importante: o peso da **caixa** (em kg) não é peso de aresta. Ele só é usado na escolha da posição (veja `regras_de_negocio.md`).

## 3. O problema do menor caminho

Dados dois vértices, queremos o caminho cuja **soma dos pesos** seja a menor possível. Em um grafo com muitas ligações, testar todos os caminhos seria lento, e o Dijkstra resolve isso de forma eficiente.

Ele funciona quando **nenhum peso é negativo**, o que vale para distâncias.

## 4. A ideia do Dijkstra

1. Dê a cada vértice uma "distância conhecida até a origem". A origem começa com 0 e todos os outros com infinito.
2. Escolha o vértice **não visitado** com a menor distância conhecida e marque como visitado. A distância dele já é a definitiva.
3. Para cada vizinho, calcule `distância do vértice atual + peso da aresta`. Se for menor do que a distância conhecida do vizinho, atualize (e anote que chegamos nele por esse vértice).
4. Repita os passos 2 e 3 até visitar o destino (ou acabar os vértices).
5. Para montar o caminho, volte do destino até a origem seguindo as anotações de "de onde vim".

Pseudocódigo:

```
distancia[origem] = 0
enquanto houver vértice não visitado:
    atual = não visitado com menor distancia
    marcar atual como visitado
    para cada vizinho de atual:
        nova = distancia[atual] + peso(atual, vizinho)
        se nova < distancia[vizinho]:
            distancia[vizinho] = nova
            anterior[vizinho] = atual
```

A função `dijkstra_didatico` do arquivo `prototipo_rota.py` faz exatamente isso, usando uma fila de prioridade (`heapq`) para achar rápido o vértice de menor distância.

## 5. Exemplo passo a passo: Entrada até T1 (acesso manual)

| Passo | Vértice visitado | Distância | Atualizações feitas |
|---|---|---|---|
| 1 | Entrada | 0 | L3 = 4 |
| 2 | L3 | 4 | L2 = 12, B1 = 12 |
| 3 | L2 | 12 | L1 = 20, M1 = 20 |
| 4 | B1 | 12 | B2 = 19, M1 = 18 (melhorou de 20) |
| 5 | M1 | 18 | M2 = 25, T1 = 24 |
| 6 | B2 | 19 | R3 = 27 (M2 continua 25) |
| 7 | L1 | 20 | T1 continua 24 (20 + 8 = 28 é pior) |
| 8 | T1 | 24 | chegamos ao destino |

Voltando do destino pelas anotações: `T1 <- M1 <- B1 <- L3 <- Entrada`. Caminho final: **Entrada, L3, B1, M1, T1, com 24 m**.

(`L2` e `B1` empatam em 12. A ordem entre eles não muda o resultado.)

## 6. Por que dois grafos

O armazém tem passagens estreitas que só o operador a pé usa. Em vez de complicar o algoritmo com exceções, montamos **dois grafos**:

- grafo **manual**: todas as arestas;
- grafo **empilhadeira**: só as arestas cujo campo `acesso` inclui `empilhadeira`.

Para o mesmo destino, o resultado pode ser diferente. Entrada até T1 dá 24 m a pé e 28 m de empilhadeira, porque a empilhadeira não passa por `B1 - M1 - T1`.

## 7. Cola do NetworkX

```python
import networkx as nx

g = nx.Graph()                                  # grafo não direcionado
g.add_edge("L3", "B1", weight=8)                # cria a aresta (e os vértices, se preciso)

nx.dijkstra_path(g, "Entrada", "T1", weight="weight")          # lista com o caminho
nx.dijkstra_path_length(g, "Entrada", "T1", weight="weight")   # distância total

g.neighbors("B1")        # vizinhos de um vértice
g.nodes                  # todos os vértices
g.edges(data=True)       # todas as arestas com os pesos
nx.is_connected(g)       # True se dá para ir de qualquer vértice a qualquer outro
```

Se não existir caminho, o NetworkX lança `nx.NetworkXNoPath`. O protótipo trata isso e devolve `None`.

## 8. Conferindo os exemplos no código

`python prototipo_rota.py` mostra as rotas da Entrada até cada prateleira. Alguns resultados do grafo de exemplo:

| Destino | Manual | Empilhadeira |
|---|---|---|
| T1 (prateleira P1) | 24 m | 28 m |
| T2 (prateleira P2) | 31 m | 35 m |
| R1 (prateleira P3) | 39 m | 43 m |

O teste `test_dijkstra_didatico_igual_ao_networkx` compara o Dijkstra escrito à mão (`dijkstra_didatico`) com o do NetworkX para todos os pares de vértices.

Sensibilidade a uma distância: se a aresta `T1 - M1` passar de 6 para 20 m no JSON, a rota manual até P1 deixa de usar a passagem estreita e fica igual à da empilhadeira (28 m).

O peso da caixa não entra no grafo. Ele é usado só na escolha da posição, descrita em `regras_de_negocio.md`.
