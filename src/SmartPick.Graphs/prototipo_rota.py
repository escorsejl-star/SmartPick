"""Cálculo de rotas do SmartPick (Equipe 2).

Lê o arquivo dados/grafo_armazem.json, monta dois grafos (manual e
empilhadeira) e calcula o menor caminho com Dijkstra.

Como rodar:
    pip install -r requirements.txt
    python prototipo_rota.py
"""

import heapq
import json
import re
from pathlib import Path

import networkx as nx

CAMINHO_JSON = Path(__file__).parent / "dados" / "grafo_armazem.json"
TIPOS_ACESSO = ("manual", "empilhadeira")

# Aceita "C05", "C-05" e "C-05-P2" (formato do front-end) como o vértice C05.
_PADRAO_ENDERECO = re.compile(r"^([A-Za-z])-?(\d{1,2})(?:-P\d)?$")


class ErroDeDados(ValueError):
    """Dados que não batem com o armazém (corredor, posição ou nível inexistente)."""


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


def vertice_da_posicao(dados, corredor, posicao):
    """Vértice do corredor onde fica uma posição (corredor "C", posição 5 -> "C05")."""
    corredor = str(corredor).strip().upper()
    if corredor not in dados["corredores"]:
        raise ErroDeDados(f"Corredor inexistente: {corredor}")
    if not 1 <= posicao <= dados["posicoesPorCorredor"]:
        raise ErroDeDados(
            f"Posição inexistente no corredor {corredor}: {posicao} "
            f"(de 1 a {dados['posicoesPorCorredor']})"
        )
    return f"{corredor}{posicao:02d}"


def normalizar_vertice(texto):
    """Converte endereços como "c-05" ou "C-05-P2" para o id do vértice ("C05")."""
    texto = str(texto).strip()
    if texto.lower() == "entrada":
        return "Entrada"
    if texto.lower() in ("saida", "saída"):
        return "Saida"
    encontrado = _PADRAO_ENDERECO.match(texto)
    if encontrado:
        return f"{encontrado.group(1).upper()}{int(encontrado.group(2)):02d}"
    return texto


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


def menores_caminhos(grafos, origem, tipo):
    """Menores caminhos da origem até todos os vértices alcançáveis.

    Devolve (distancias, caminhos): dois dicionários indexados pelo vértice de
    destino. Vértices que o acesso não alcança não aparecem nos dicionários.
    """
    grafo = grafos[tipo]
    if origem not in grafo:
        raise ValueError(f"Vértice inexistente: {origem}")
    return nx.single_source_dijkstra(grafo, origem, weight="weight")


def dijkstra_didatico(grafo, origem, destino):
    """Dijkstra escrito à mão, para entender o algoritmo.

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

    print("Rotas a partir da Entrada (corredor-posição)\n")
    for corredor, posicao in [("A", 10), ("A", 1), ("C", 5), ("E", 3), ("B", 5), ("F", 10)]:
        vertice = vertice_da_posicao(dados, corredor, posicao)
        print(f"{corredor}-{posicao:02d}")
        for tipo in TIPOS_ACESSO:
            resultado = calcular_rota(grafos, "Entrada", vertice, tipo)
            if resultado is None:
                print(f"  {tipo:<12} sem acesso")
            else:
                caminho = " -> ".join(resultado["rota"])
                print(f"  {tipo:<12} {resultado['distancia']:>3} m  {caminho}")
        print()


if __name__ == "__main__":
    main()
