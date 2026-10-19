"""Testes do protótipo de rotas.

Rodam com Python puro ou com pytest:
    python test_prototipo.py
    pytest
"""

import networkx as nx

from prototipo_rota import (
    calcular_rota,
    carregar_dados,
    dijkstra_didatico,
    montar_grafos,
)

DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)

# Distâncias esperadas da Entrada até cada prateleira: (manual, empilhadeira)
ESPERADO = {
    "P1": (24, 28),
    "P2": (31, 35),
    "P3": (39, 43),
    "P4": (12, 12),
    "P5": (19, 19),
    "P6": (27, 27),
}


def test_distancias_das_prateleiras():
    for prateleira, (manual, empilhadeira) in ESPERADO.items():
        vertice = DADOS["prateleiras"][prateleira]
        assert calcular_rota(GRAFOS, "Entrada", vertice, "manual")["distancia"] == manual
        assert calcular_rota(GRAFOS, "Entrada", vertice, "empilhadeira")["distancia"] == empilhadeira


def test_empilhadeira_nao_usa_passagem_estreita():
    arestas_estreitas = [
        (a["origem"], a["destino"]) for a in DADOS["arestas"] if a["acesso"] == ["manual"]
    ]
    for prateleira, vertice in DADOS["prateleiras"].items():
        rota = calcular_rota(GRAFOS, "Entrada", vertice, "empilhadeira")["rota"]
        trechos = set(zip(rota, rota[1:])) | set(zip(rota[1:], rota))
        for aresta in arestas_estreitas:
            assert aresta not in trechos, f"{prateleira} usou passagem estreita"


def test_grafos_sao_conexos():
    for tipo, grafo in GRAFOS.items():
        assert nx.is_connected(grafo), f"Grafo {tipo} tem vértices isolados"


def test_prateleiras_apontam_para_vertices_existentes():
    ids = {v["id"] for v in DADOS["vertices"]}
    for prateleira, vertice in DADOS["prateleiras"].items():
        assert vertice in ids, f"{prateleira} aponta para {vertice}, que não existe"


def test_arestas_apontam_para_vertices_existentes():
    ids = {v["id"] for v in DADOS["vertices"]}
    for aresta in DADOS["arestas"]:
        assert aresta["origem"] in ids and aresta["destino"] in ids


def test_dijkstra_didatico_igual_ao_networkx():
    for tipo, grafo in GRAFOS.items():
        for origem in grafo.nodes:
            for destino in grafo.nodes:
                esperado = calcular_rota(GRAFOS, origem, destino, tipo)["distancia"]
                obtido = dijkstra_didatico(grafo, origem, destino)["distancia"]
                assert obtido == esperado, f"{tipo}: {origem} -> {destino}"


def test_vertice_inexistente():
    try:
        calcular_rota(GRAFOS, "Entrada", "XX", "manual")
    except ValueError:
        return
    raise AssertionError("Era esperado ValueError para vértice inexistente")


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
