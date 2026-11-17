# Grafos e Dijkstra: anotações da Equipe 2

Anotações sobre o algoritmo usado no módulo de rotas, com exemplos do grafo do próprio SmartPick (`dados/grafo_armazem.json`).

## 1. O que é um grafo

Um grafo é um conjunto de **vértices** (pontos) ligados por **arestas** (linhas).

No SmartPick:
- cada **corredor** (ou ponto de passagem) é um vértice: `A05`, `C10`, `Entrada`, `Saida` e assim por diante (a letra é o corredor e o número é a posição);
- cada **ligação** entre dois corredores é uma aresta.

As ligações do armazém funcionam nos dois sentidos, então o grafo é **não direcionado** (`nx.Graph` no NetworkX).

## 2. O que é o peso de uma aresta

O peso é o "custo" de usar aquela ligação. No SmartPick, o peso é a **distância em metros**.

Exemplo: a aresta `A05 - A06` pesa 2, ou seja, andar da posição 5 até a posição 6 do corredor A são 2 metros.

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

## 5. Exemplo passo a passo

Para ver o algoritmo em ação, usamos um grafo pequeno: `S` (origem), `A`, `B` e `C`, com as ligações `S - A` (4), `S - B` (2), `B - A` (1), `A - C` (5) e `B - C` (8). Queremos o menor caminho de `S` até `C`.

| Passo | Vértice visitado | Distância | Atualizações feitas |
|---|---|---|---|
| 1 | S | 0 | A = 4, B = 2 |
| 2 | B | 2 | A = 3 (melhorou de 4), C = 10 |
| 3 | A | 3 | C = 8 (melhorou de 10) |
| 4 | C | 8 | chegamos ao destino |

Voltando do destino pelas anotações: `C <- A <- B <- S`. Caminho final: **S, B, A, C, com 8**. Note que o caminho direto `S - A - C` (9) e o `S - B - C` (10) são piores.

No SmartPick acontece o mesmo, só que com 62 vértices (veja a seção 8).

## 6. Por que dois grafos

O armazém tem corredores onde só o operador a pé circula. Em vez de complicar o algoritmo com exceções, montamos **dois grafos**:

- grafo **manual**: todas as arestas;
- grafo **empilhadeira**: só as arestas cujo campo `acesso` inclui `empilhadeira` (no exemplo, os corredores C e E, os corredores transversais e as ligações da entrada e da saída).

Para o mesmo destino, o resultado pode ser diferente. Entrada até a posição A-01 dá 22 m a pé (sobe pelo corredor A) e 46 m de empilhadeira, que não entra no corredor A e precisa dar a volta pelo corredor C. E há destinos que a empilhadeira não alcança, como a posição B-05.

## 7. Cola do NetworkX

```python
import networkx as nx

g = nx.Graph()                                  # grafo não direcionado
g.add_edge("A05", "A06", weight=2)                # cria a aresta (e os vértices, se preciso)

nx.dijkstra_path(g, "Entrada", "C05", weight="weight")          # lista com o caminho
nx.dijkstra_path_length(g, "Entrada", "C05", weight="weight")   # distância total

g.neighbors("A05")        # vizinhos de um vértice
g.nodes                  # todos os vértices
g.edges(data=True)       # todas as arestas com os pesos
nx.is_connected(g)       # True se dá para ir de qualquer vértice a qualquer outro
```

Se não existir caminho, o NetworkX lança `nx.NetworkXNoPath`. O protótipo trata isso e devolve `None`.

## 8. Conferindo os exemplos no código

`python prototipo_rota.py` mostra as rotas da Entrada até algumas posições. Alguns resultados do grafo de exemplo:

| Destino | Manual | Empilhadeira |
|---|---|---|
| A-10 | 4 m | 4 m |
| A-01 | 22 m | 46 m |
| C-05 | 26 m | 26 m |
| B-05 | 20 m | sem acesso |

O teste `test_dijkstra_didatico_igual_ao_networkx` compara o Dijkstra escrito à mão (`dijkstra_didatico`) com o do NetworkX para todos os pares de vértices, nos dois grafos.

Para mudar o armazém (distâncias, corredores liberados para a empilhadeira), altere as constantes do `gerar_grafo.py` e rode `python gerar_grafo.py`. Depois rode os testes: se a mudança for proposital, atualize os valores esperados.

O peso da caixa não entra no grafo. Ele é usado só na escolha da posição, descrita em `regras_de_negocio.md`.
