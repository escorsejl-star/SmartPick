# Guia de integração da API de grafos (Equipes 1 e 3)

A API calcula rotas no armazém e recomenda a posição de armazenamento de uma caixa. Este guia mostra como chamá-la a partir do front-end (JavaScript) e da API em C#.

## 1. Como subir a API

Na pasta `src/SmartPick.Graphs`, com o ambiente virtual ativado:

```
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

- Endereço base: `http://127.0.0.1:8001`
- Documentação e testes no navegador: `http://127.0.0.1:8001/docs`
- O CORS já está liberado, então uma página aberta no navegador pode chamar a API direto. Para restringir as origens, defina a variável de ambiente `SMARTPICK_CORS_ORIGENS` (por exemplo, `http://localhost:5500`).
- O serviço não guarda estado e não acessa o banco: tudo o que ele precisa vem no pedido.

## 2. Convenções

O layout segue o front-end (`mapa.js` e `catalogo.js`).

| Conceito | Como aparece na API |
|---|---|
| Corredor | Letra de `A` a `F` (campo `corredor`) |
| Posição | Número de 1 a 10 (campo `posicao`). No catálogo aparece como `'03'`: envie `3` |
| Prateleira (altura) | Campo `nivel`, de 1 a 5. O `prat` do catálogo (`'P1'` a `'P5'`) é o nível 1 a 5 |
| Endereço | `corredor-posição-prateleira`, por exemplo `C-05-P2` (campo `endereco` das respostas) |
| `GROUND` e `HIGH` | Campo `classeNivel` das respostas: `GROUND` = acesso manual, `HIGH` = exige empilhadeira |
| Vértices da rota | `Entrada`, `Saida` e `A01` a `F10` (letra do corredor mais posição com dois dígitos) |

## 3. Endpoints

### GET /saude

Confere se o serviço está no ar. Resposta: `{"status": "ok"}`.

### GET /armazem

Devolve o layout do grafo (vértices e arestas) e os valores atuais das regras (`regras`: limite de peso, nível que exige empilhadeira e penalidades). Serve para desenhar o mapa e para conferir as regras.

### GET /rota

Menor caminho entre dois pontos.

Parâmetros: `origem`, `destino` (id do vértice ou endereço, como `Entrada`, `C05` ou `C-05`) e `tipo` (`manual` ou `empilhadeira`).

Exemplo: `GET /rota?origem=Entrada&destino=C-05&tipo=manual`

```json
{
  "origem": "Entrada",
  "destino": "C05",
  "tipoAcesso": "manual",
  "rota": ["Entrada", "A10", "B10", "C10", "C09", "C08", "C07", "C06", "C05"],
  "distancia": 26
}
```

### POST /rota/paradas

Rota da Entrada passando por várias paradas, para a tela do mapa.

Pedido:

```json
{
  "tipo": "manual",
  "otimizar": false,
  "terminarNaSaida": true,
  "paradas": [
    { "corredor": "C", "posicao": 5 },
    { "corredor": "A", "posicao": 3 }
  ]
}
```

- `otimizar`: se for `true`, a API reordena as paradas pelo vizinho mais próximo (uma heurística simples, que não garante a melhor ordem possível). Se for `false`, segue a ordem enviada.
- `terminarNaSaida`: inclui o trecho final até a Saída.

Resposta (com as listas de `rota` abreviadas):

```json
{
  "tipoAcesso": "manual",
  "otimizada": false,
  "ordem": [
    { "corredor": "C", "posicao": 5, "vertice": "C05" },
    { "corredor": "A", "posicao": 3, "vertice": "A03" }
  ],
  "trechos": [
    { "de": "Entrada", "para": "C05", "distancia": 26, "rota": ["Entrada", "A10", "..."] },
    { "de": "C05", "para": "A03", "distancia": 24, "rota": ["C05", "C04", "..."] },
    { "de": "A03", "para": "Saida", "distancia": 48, "rota": ["A03", "A04", "..."] }
  ],
  "rota": ["Entrada", "A10", "B10", "..."],
  "distanciaTotal": 98
}
```

`trechos` traz a distância e o caminho de cada parada até a próxima (útil para a lista de paradas da tela). `rota` é o caminho completo, e `distanciaTotal` é a soma em metros.

### POST /recomendar

Escolhe a melhor posição entre as livres. É o endpoint que a API em C# deve chamar quando uma caixa é cadastrada.

Pedido:

```json
{
  "pesoKg": 8,
  "dimensoes": { "comprimentoCm": 40, "larguraCm": 30, "alturaCm": 30 },
  "posicoesDisponiveis": [
    { "id": 1, "corredor": "A", "posicao": 10, "nivel": 1 },
    { "id": 2, "corredor": "A", "posicao": 10, "nivel": 2 },
    { "id": 3, "corredor": "A", "posicao": 10, "nivel": 3 }
  ]
}
```

- `dimensoes` é opcional e, por enquanto, não entra no cálculo.
- Cada posição pode ter `"restrita": true`, para posições que exigem empilhadeira mesmo em níveis baixos.
- Campos a mais no pedido (como `lado`) são ignorados.

Resposta:

```json
{
  "posicaoId": 2,
  "corredor": "A",
  "posicao": 10,
  "nivel": 2,
  "endereco": "A-10-P2",
  "tipoAcesso": "manual",
  "classeNivel": "GROUND",
  "distancia": 4,
  "custo": 6,
  "rota": ["Entrada", "A10"]
}
```

Quando nenhuma posição serve (a resposta tem código 200):

```json
{ "posicaoId": null, "mensagem": "Nenhuma posição disponível para esta caixa" }
```

Quem chama deve conferir se `posicaoId` é nulo antes de usar o resto da resposta.

## 4. Erros

| Código | Quando |
|---|---|
| 404 | Em `/rota`: vértice inexistente ou sem caminho para o tipo de acesso (por exemplo, a empilhadeira em um corredor só manual) |
| 422 | Dados inválidos: corredor, posição ou nível inexistente, peso menor ou igual a zero, tipo de acesso inválido, lista de paradas vazia, parada que o acesso não alcança |

O corpo do erro traz o motivo em `detail`.

## 5. Exemplo em JavaScript (front-end)

```javascript
const API = "http://127.0.0.1:8001";

async function rotaDaColeta(paradas, tipo = "manual") {
  const resposta = await fetch(`${API}/rota/paradas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, otimizar: true, paradas }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.detail);
  }
  return dados;
}

// Cada parada precisa ter corredor (letra de A a F) e posicao (de 1 a 10).
rotaDaColeta([
  { corredor: "C", posicao: 5 },
  { corredor: "A", posicao: 3 },
]).then((dados) => {
  console.log(dados.distanciaTotal + " m");
  console.log(dados.rota);
});
```

O mesmo vale para o `POST /recomendar`: troque o endereço e o corpo do pedido.

## 6. Exemplo em C# (API da Equipe 1)

```csharp
using System.Net.Http.Json;

public record RecomendacaoResposta(
    int? PosicaoId,
    string? Mensagem,
    string? Endereco,
    string? TipoAcesso,
    string? ClasseNivel,
    double? Distancia,
    double? Custo,
    List<string>? Rota);

public class ServicoDeGrafos
{
    private readonly HttpClient _http = new() { BaseAddress = new Uri("http://127.0.0.1:8001") };

    public async Task<RecomendacaoResposta?> RecomendarAsync(double pesoKg, IEnumerable<object> posicoesLivres)
    {
        var pedido = new { pesoKg, posicoesDisponiveis = posicoesLivres };
        var resposta = await _http.PostAsJsonAsync("/recomendar", pedido);
        resposta.EnsureSuccessStatusCode();
        return await resposta.Content.ReadFromJsonAsync<RecomendacaoResposta>();
    }
}
```

Cada item de `posicoesLivres` deve ter os campos `id`, `corredor`, `posicao` e `nivel` (e, se houver, `restrita`), com esses nomes em minúsculas, como no exemplo do pedido.

## 7. Como a Equipe 1 monta o pedido

1. Receber o peso da caixa cadastrada.
2. Buscar no banco as posições **livres**, cada uma com `id`, `corredor`, `posicao` e `nivel`.
3. Chamar `POST /recomendar` com o peso e essa lista.
4. Se `posicaoId` for nulo, avisar o usuário com a `mensagem`. Senão, gravar a posição escolhida e marcá-la como ocupada (RN07).
5. Devolver ao front-end o `endereco`, o `tipoAcesso` e a `rota`.

## 8. Combinados e pontos a confirmar

- O layout (6 corredores, 10 posições, 5 níveis), as distâncias, o limite de 20 kg e as penalidades são valores de exemplo. Se o layout real mudar, a Equipe 2 atualiza o `dados/grafo_armazem.json` (o `gerar_grafo.py` ajuda) e a API continua com os mesmos endpoints.
- A partir de qual nível a posição exige empilhadeira (hoje, o 3) deve ser confirmado.
- Se mudar o formato de algum pedido ou resposta, avisem a Equipe 2 e atualizem este guia.
