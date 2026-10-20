# Regras de negócio do SmartPick (rascunho da Equipe 2)

Documento da Sprint 1, Semana 3. Os valores marcados com **(a confirmar)** são sugestões para o grupo discutir e fechar na reunião de integração. Depois de fechados, devem virar constantes no código do FastAPI, fáceis de alterar.

## 1. Convenções

| Item | Convenção sugerida |
|---|---|
| Nível de altura | 1 (chão), 2 e 3 (mais alto) |
| Profundidade | 1 = frente da prateleira, 2 = fundo |
| Distância | metros |
| Caixa leve | menos de 20 kg **(a confirmar)** |
| Caixa pesada | 20 kg ou mais **(a confirmar)** |
| Posição que exige empilhadeira | nível 3, ou posição marcada como restrita pela Equipe 1 |
| Tipo de acesso | `manual` ou `empilhadeira` |

## 2. As regras do PDF, uma a uma

| Código | Regra | Como o sistema aplica |
|---|---|---|
| RN01 | Caixas pesadas têm prioridade para posições inferiores | Caixa pesada só pode ir nos níveis 1 e 2. O nível 1 tem penalidade menor |
| RN02 | Caixas leves podem ocupar posições superiores | Caixa leve pode ir em qualquer nível. Os níveis baixos têm penalidade, para ficarem livres para as pesadas |
| RN03 | Posições elevadas ou restritas exigem empilhadeira | Nível 3 ou posição restrita define `tipoAcesso = empilhadeira` |
| RN04 | A empilhadeira só usa corredores autorizados | O grafo da empilhadeira só tem as arestas com `empilhadeira` no campo `acesso` |
| RN05 | O operador a pé só usa corredores de acesso manual | O grafo manual só tem as arestas com `manual` no campo `acesso` |
| RN06 | A posição informa se a caixa fica na frente ou no fundo | Toda posição tem `profundidade` (1 ou 2), devolvida na resposta. O fundo tem penalidade pequena |
| RN07 | Posições ocupadas não podem ser sugeridas | Posições ocupadas são descartadas antes de qualquer cálculo |

Decisão pendente para RN06: ao guardar uma caixa no fundo, a frente do mesmo nível precisa estar livre, porque a caixa passa por ela. O grupo deve decidir se isso será verificado agora ou ficará como evolução futura.

## 3. Como o sistema escolhe a posição (Etapa 1)

Para cada pedido (caixa com peso e dimensões), o FastAPI recebe a lista de posições livres e faz:

1. **Filtrar.** Descarta as posições proibidas para o peso da caixa (caixa pesada no nível 3).
2. **Definir o acesso.** Para cada posição restante, o acesso é `empilhadeira` se ela exigir (RN03), senão `manual`.
3. **Calcular a rota** da Entrada até o corredor da prateleira, no grafo do tipo de acesso (Etapa 2, Dijkstra).
4. **Calcular o custo:**

```
custo = distância da rota + penalidade de nível + penalidade de profundidade + penalidade de empilhadeira
```

5. **Escolher** a posição de menor custo. Se não restar nenhuma, devolver a mensagem "Nenhuma posição disponível" (RF13).

### Tabela de penalidades (a confirmar)

As penalidades são em "metros equivalentes", para poderem ser somadas à distância.

| Situação | Penalidade |
|---|---|
| Caixa leve no nível 1 | +5 |
| Caixa leve no nível 2 | +2 |
| Caixa leve no nível 3 | 0 |
| Caixa pesada no nível 1 | 0 |
| Caixa pesada no nível 2 | +3 |
| Caixa pesada no nível 3 | proibido |
| Posição no fundo (profundidade 2) | +2 |
| Uso de empilhadeira | +10 (evita usar empilhadeira sem necessidade) |

Para mudar o comportamento do sistema, basta mudar esses números, sem mexer no grafo nem no Dijkstra.

### Exemplo 1: caixa leve de 8 kg

Candidatas na prateleira P4 (corredor `B1`, rota de 12 m), todas na frente:

| Nível | Acesso | Rota | Penalidade de nível | Empilhadeira | Custo |
|---|---|---|---|---|---|
| 1 | manual | 12 | +5 | 0 | **17** |
| 2 | manual | 12 | +2 | 0 | **14** |
| 3 | empilhadeira | 12 | 0 | +10 | **22** |

O sistema escolhe o **nível 2**: evita o nível 1 (reservado às pesadas) e evita usar empilhadeira à toa.

### Exemplo 2: caixa pesada de 30 kg

Mesmas candidatas: o nível 3 é proibido. O nível 1 custa 12 + 0 = **12**, e o nível 2 custa 12 + 3 = **15**. O sistema escolhe o **nível 1**.

## 4. Contrato de dados com as outras equipes (rascunho)

Para fechar na reunião da Semana 3.

Pedido da API em C# ao FastAPI (`POST /recomendar`):

```json
{
  "pesoKg": 8,
  "dimensoes": { "alturaCm": 40, "larguraCm": 30, "profundidadeCm": 30 },
  "posicoesDisponiveis": [
    { "id": 12, "prateleira": "P4", "nivel": 2, "profundidade": 1 },
    { "id": 13, "prateleira": "P4", "nivel": 3, "profundidade": 1 }
  ]
}
```

O FastAPI descobre o corredor de cada prateleira pelo campo `prateleiras` do arquivo `grafo_armazem.json`.

Resposta:

```json
{
  "posicaoId": 12,
  "tipoAcesso": "manual",
  "distancia": 12,
  "custo": 14,
  "rota": ["Entrada", "L3", "B1"]
}
```

Quando não houver posição possível:

```json
{
  "posicaoId": null,
  "mensagem": "Nenhuma posição disponível para esta caixa"
}
```

## 5. Perguntas para a Equipe 1 (layout real)

1. Quantas prateleiras, quantos níveis e quantas profundidades o armazém terá?
2. Quais corredores são largos o bastante para a empilhadeira?
3. De qual corredor se acessa cada prateleira?
4. Quais distâncias reais (ou aproximadas) usar entre os corredores?
5. Existem posições "restritas" que exigem empilhadeira mesmo em níveis baixos?
6. Qual será o formato do identificador da posição (número, código como `P4-N2-F1`)?

## 6. Perguntas para a Equipe 3 (tela)

1. A tela mostra a rota como lista de corredores, ou como linha desenhada no mapa?
2. Que mensagem aparece quando não há posição disponível?
3. A tela precisa mostrar o custo e as penalidades, ou só a posição e a rota?
