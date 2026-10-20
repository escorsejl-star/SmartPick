"""Protótipo de cálculo de rotas do SmartPick (Sprint 1, Equipe 2).

Lê o arquivo dados/grafo_armazem.json, monta dois grafos (manual e
empilhadeira) e calcula o menor caminho com Dijkstra.

Como rodar:
    pip install -r requirements.txt
    python prototipo_rota.py
"""

import heapq
import json
from pathlib import Path

import networkx as nx

CAMINHO_JSON = Path(__file__).parent / "dados" / "grafo_armazem.json"
TIPOS_ACESSO = ("manual", "empilhadeira")


def carregar_dados(caminho=CAMINHO_JSON):
    """Lê o arquivo JSON do armazém e devolve um dicionário."""
    with open(caminho, encoding="utf-8") as arquivo:
        return json.load(arquivo)


def montar_grafo(dados, tipo):
    """Monta o grafo de um tipo de acesso.

    Só entram as arestas cujo campo "acesso" contém o tipo pedido.
    O peso de cada aresta é a distância em metros.
    """
    if tipo not in TIPOS_ACESSO:
        raise ValueError(f"Tipo de acesso inválido: {tipo}")

    grafo = nx.Graph()
    for vertice in dados["vertices"]:
        grafo.add_node(vertice["id"], nome=vertice["nome"])
    for aresta in dados["arestas"]:
        if tipo in aresta["acesso"]:
            grafo.add_edge(aresta["origem"], aresta["destino"], weight=aresta["distancia"])
    return grafo


def montar_grafos(dados):
    """Devolve um dicionário com os dois grafos: manual e empilhadeira."""
    return {tipo: montar_grafo(dados, tipo) for tipo in TIPOS_ACESSO}


def calcular_rota(grafos, origem, destino, tipo):
    """Calcula o menor caminho usando o Dijkstra do NetworkX.

    Devolve {"rota": [...], "distancia": n} ou None se não existir caminho.
    """
    grafo = grafos[tipo]
    for vertice in (origem, destino):
        if vertice not in grafo:
            raise ValueError(f"Vértice inexistente: {vertice}")
    try:
        rota = nx.dijkstra_path(grafo, origem, destino, weight="weight")
        distancia = nx.dijkstra_path_length(grafo, origem, destino, weight="weight")
    except nx.NetworkXNoPath:
        return None
    return {"rota": rota, "distancia": distancia}


def dijkstra_didatico(grafo, origem, destino):
    """Dijkstra escrito à mão, para entender o algoritmo (Semana 2).

    Mantém uma fila de prioridade com os vértices ainda não visitados.
    Sempre visita o vértice com a menor distância conhecida até a origem.
    """
    distancia = {origem: 0}
    anterior = {}
    fila = [(0, origem)]
    visitados = set()

    while fila:
        dist_atual, atual = heapq.heappop(fila)
        if atual in visitados:
            continue
        visitados.add(atual)
        if atual == destino:
            break
        for vizinho, dados in grafo[atual].items():
            nova = dist_atual + dados["weight"]
            if nova < distancia.get(vizinho, float("inf")):
                distancia[vizinho] = nova
                anterior[vizinho] = atual
                heapq.heappush(fila, (nova, vizinho))

    if destino not in distancia:
        return None
    rota = [destino]
    while rota[0] != origem:
        rota.insert(0, anterior[rota[0]])
    return {"rota": rota, "distancia": distancia[destino]}


def main():
    dados = carregar_dados()
    grafos = montar_grafos(dados)

    print("Rotas a partir da Entrada até cada prateleira\n")
    for prateleira, vertice in dados["prateleiras"].items():
        print(f"{prateleira} (acesso por {vertice})")
        for tipo in TIPOS_ACESSO:
            resultado = calcular_rota(grafos, "Entrada", vertice, tipo)
            caminho = " -> ".join(resultado["rota"])
            print(f"  {tipo:<12} {resultado['distancia']:>3} m  {caminho}")
        print()


if __name__ == "__main__":
    main()
