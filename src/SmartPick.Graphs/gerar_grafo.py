"""Gera dados/grafo_armazem.json a partir dos parâmetros do layout.

O layout segue o front-end (mapa.js): 6 corredores (A a F) com 10 posições
cada. Cada corredor é um corredor vertical. Os corredores transversais, no
topo (posição 01) e na base (posição 10), ligam os corredores entre si. A
Entrada fica na base do corredor A e a Saída na base do corredor F.

Para mudar o armazém (distâncias, quantidade de corredores, quais corredores a
empilhadeira usa), altere as constantes abaixo e rode:
    python gerar_grafo.py
"""

import json
from pathlib import Path

CORREDORES = ["A", "B", "C", "D", "E", "F"]
POSICOES_POR_CORREDOR = 10
NIVEIS = 5

# Corredores liberados para a empilhadeira (os demais são só de acesso manual).
CORREDORES_EMPILHADEIRA = {"C", "E"}

# Distâncias em metros (valores de exemplo, a confirmar com a Equipe 1).
DIST_ENTRE_POSICOES = 2     # duas posições vizinhas no mesmo corredor
DIST_ENTRE_CORREDORES = 6   # dois corredores vizinhos, pelo corredor transversal
DIST_ENTRADA = 4            # da Entrada até o corredor A
DIST_SAIDA = 4              # do corredor F até a Saída

AMBOS = ["manual", "empilhadeira"]
SO_MANUAL = ["manual"]

DESTINO = Path(__file__).parent / "dados" / "grafo_armazem.json"


def vertice(corredor, posicao):
    return f"{corredor}{posicao:02d}"


def gerar():
    vertices = [
        {"id": "Entrada", "nome": "Entrada", "tipo": "entrada"},
        {"id": "Saida", "nome": "Saída", "tipo": "saida"},
    ]
    for corredor in CORREDORES:
        for posicao in range(1, POSICOES_POR_CORREDOR + 1):
            vertices.append({
                "id": vertice(corredor, posicao),
                "nome": f"Corredor {corredor}, posição {posicao:02d}",
                "tipo": "corredor",
                "corredor": corredor,
                "posicao": posicao,
            })

    arestas = []

    def aresta(origem, destino, distancia, acesso):
        arestas.append({"origem": origem, "destino": destino, "distancia": distancia, "acesso": acesso})

    ultima = POSICOES_POR_CORREDOR
    aresta("Entrada", vertice(CORREDORES[0], ultima), DIST_ENTRADA, AMBOS)
    aresta(vertice(CORREDORES[-1], ultima), "Saida", DIST_SAIDA, AMBOS)

    # Dentro de cada corredor, de posição em posição.
    for corredor in CORREDORES:
        acesso = AMBOS if corredor in CORREDORES_EMPILHADEIRA else SO_MANUAL
        for posicao in range(1, ultima):
            aresta(vertice(corredor, posicao), vertice(corredor, posicao + 1), DIST_ENTRE_POSICOES, acesso)

    # Corredores transversais: topo (posição 1) e base (última posição).
    for posicao in (1, ultima):
        for a, b in zip(CORREDORES, CORREDORES[1:]):
            aresta(vertice(a, posicao), vertice(b, posicao), DIST_ENTRE_CORREDORES, AMBOS)

    return vertices, arestas


def linha(item):
    return "    " + json.dumps(item, ensure_ascii=False)


def main():
    vertices, arestas = gerar()
    texto = "{\n"
    texto += '  "versao": 2,\n'
    texto += ('  "descricao": "Grafo de exemplo do armazem SmartPick, no layout do front-end '
              '(corredores A a F, 10 posicoes cada). Distancias em metros (valores de exemplo, '
              'a confirmar com a Equipe 1).",\n')
    texto += f'  "corredores": {json.dumps(CORREDORES)},\n'
    texto += f'  "posicoesPorCorredor": {POSICOES_POR_CORREDOR},\n'
    texto += f'  "niveis": {NIVEIS},\n'
    texto += '  "vertices": [\n' + ",\n".join(linha(v) for v in vertices) + "\n  ],\n"
    texto += '  "arestas": [\n' + ",\n".join(linha(a) for a in arestas) + "\n  ]\n"
    texto += "}\n"
    DESTINO.write_text(texto, encoding="utf-8")
    print(f"{len(vertices)} vértices e {len(arestas)} arestas salvos em {DESTINO}")


if __name__ == "__main__":
    main()
