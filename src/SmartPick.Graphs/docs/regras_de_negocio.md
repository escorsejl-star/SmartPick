# Regras de negócio do SmartPick (Equipe 2)

Os valores marcados com **(a confirmar)** são sugestões para o grupo discutir e fechar. Depois de fechados, devem ficar como constantes no `recomendacao.py`, fáceis de alterar.

## 1. Convenções

O layout segue o front-end (`mapa.js` e `catalogo.js`).

| Item | Convenção |
|---|---|
| Corredores | A, B, C, D, E e F |
| Posições | 1 a 10 em cada corredor, com prateleiras dos dois lados |
| Nível de altura | Prateleira P1 a P5 do catálogo (nível 1 a 5, de baixo para cima) |
| Endereço | `corredor-posição-prateleira`, por exemplo `C-05-P2` |
| Classe do nível | `GROUND` (acesso manual) ou `HIGH` (exige empilhadeira), como no catálogo |
| Nível que exige empilhadeira | do nível 3 para cima **(a confirmar)**, pois o catálogo só usa P1 e P2 como GROUND e P4 e P5 como HIGH |
| Caixa leve | menos de 20 kg **(a confirmar)** |
| Caixa pesada | 20 kg ou mais **(a confirmar)** |
| Distâncias | metros, valores de exemplo **(a confirmar)** |

A profundidade das prateleiras (frente e fundo, RN06 do PDF) está fora do escopo por decisão do grupo.

## 2. As regras do PDF, uma a uma

| Código | Regra | Como o sistema aplica |
|---|---|---|
| RN01 | Caixas pesadas têm prioridade para posições inferiores | Caixa pesada só vai nos níveis 1 e 2. O nível 1 tem penalidade menor |
| RN02 | Caixas leves podem ocupar posições superiores | Caixa leve vai em qualquer nível. Os níveis baixos têm penalidade, para ficarem livres para as pesadas |
| RN03 | Posições elevadas ou restritas exigem empilhadeira | Nível 3 ou mais, ou posição marcada como restrita, usa o grafo da empilhadeira |
| RN04 | A empilhadeira só usa corredores autorizados | O grafo da empilhadeira só tem as arestas com `empilhadeira` no campo `acesso` |
| RN05 | O operador a pé só usa corredores de acesso manual | O grafo manual usa todas as arestas, e as só manuais não aparecem no da empilhadeira |
| RN06 | A posição informa se a caixa fica na frente ou no fundo | Fora do escopo (decisão do grupo) |
| RN07 | Posições ocupadas não podem ser sugeridas | A API recebe só as posições livres |

## 3. Corredores e acesso no exemplo

No grafo de exemplo (`dados/grafo_armazem.json`):

- Os corredores **C** e **E** são largos e liberados para a empilhadeira. É onde ficam os produtos HIGH do catálogo.
- Os corredores **A, B, D e F** são só de acesso manual.
- Os corredores transversais (topo, na posição 1, e base, na posição 10) são largos. A Entrada fica na base do corredor A e a Saída na base do corredor F.

Consequência: uma posição de nível alto em um corredor só manual (por exemplo, B-05-P4) nunca é recomendada, porque a empilhadeira não chega até ela. Esse desenho é uma suposição **(a confirmar com a Equipe 1)**.

## 4. Como o sistema escolhe a posição (Etapa 1)

Para cada pedido (caixa com peso e lista de posições livres), o serviço faz:

1. **Validar.** Corredor, posição e nível precisam existir no armazém (senão, erro 422).
2. **Filtrar.** Descarta as posições proibidas para o peso (caixa pesada no nível 3 ou mais).
3. **Definir o acesso.** Empilhadeira se o nível for 3 ou mais, ou se a posição for restrita. Senão, manual.
4. **Calcular a rota** da Entrada até o corredor da posição, no grafo do tipo de acesso. Posições que o acesso não alcança são descartadas.
5. **Calcular o custo:**

```
custo = distância da rota + penalidade de nível + penalidade de empilhadeira
```

6. **Escolher** a posição de menor custo (empate: menor distância, depois menor id). Se não restar nenhuma, devolver "Nenhuma posição disponível para esta caixa" (RF13).

### Tabela de penalidades (a confirmar)

As penalidades são em "metros equivalentes", para poderem ser somadas à distância.

| Nível (prateleira) | Caixa leve | Caixa pesada |
|---|---|---|
| 1 (P1) | +5 | 0 |
| 2 (P2) | +2 | +3 |
| 3 (P3) | 0 | proibido |
| 4 (P4) | 0 | proibido |
| 5 (P5) | 0 | proibido |

Uso de empilhadeira: **+10** (evita usar empilhadeira sem necessidade).

Para mudar o comportamento, basta mudar esses números no `recomendacao.py`, sem mexer no grafo nem no Dijkstra.

### Exemplo 1: caixa leve de 8 kg na posição A-10 (a 4 m da Entrada)

| Nível | Acesso | Rota | Penalidade de nível | Empilhadeira | Custo |
|---|---|---|---|---|---|
| 1 | manual | 4 | +5 | 0 | **9** |
| 2 | manual | 4 | +2 | 0 | **6** |
| 3 | empilhadeira | 4 | 0 | +10 | **14** |

O sistema escolhe o **nível 2** (endereço `A-10-P2`): evita o nível 1, reservado às pesadas, e evita usar empilhadeira à toa.

### Exemplo 2: caixa pesada de 30 kg nas mesmas posições

O nível 3 é proibido. O nível 1 custa 4 + 0 = **4**, e o nível 2 custa 4 + 3 = **7**. O sistema escolhe o **nível 1**.

### Exemplo 3: caixa leve de 8 kg em posições altas

- C-05-P4: acesso de empilhadeira, rota de 26 m, custo 26 + 0 + 10 = **36**.
- B-05-P4: a empilhadeira não entra no corredor B, então a posição é descartada.

## 5. Contrato de dados

Os formatos de pedido e resposta, com exemplos em JavaScript e C#, estão em `docs/guia_integracao.md`.

## 6. Perguntas para a Equipe 1 (layout real)

1. O armazém real tem 6 corredores (A a F) com 10 posições, como no front-end?
2. Quais corredores são largos o bastante para a empilhadeira?
3. A partir de qual prateleira (P3, P4) a posição exige empilhadeira?
4. Onde ficam a entrada e a saída do armazém?
5. Quais são as distâncias reais (ou aproximadas, em metros) entre posições vizinhas e entre corredores?
6. Existem posições restritas, que exigem empilhadeira mesmo em níveis baixos?

## 7. Perguntas para a Equipe 3 (telas)

1. A tela do mapa vai usar a rota calculada pela API (`POST /rota/paradas`) no lugar da linha reta atual?
2. Que mensagem aparece quando não há posição disponível?
3. A tela precisa mostrar o custo e as penalidades, ou só o endereço e a rota?
