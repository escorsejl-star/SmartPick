"""Testes do cálculo de rotas.

Rodam com Python puro ou com pytest:
    python test_prototipo.py
    pytest
"""

import networkx as nx

from prototipo_rota import (
    ErroDeDados,
    calcular_rota,
    carregar_dados,
    dijkstra_didatico,
    menores_caminhos,
    montar_grafos,
    normalizar_vertice,
    vertice_da_posicao,
)

DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)

# Distâncias esperadas a partir da Entrada: vértice -> (manual, empilhadeira)
ESPERADO = {
    "A10": (4, 4),
    "A01": (22, 46),     # a empilhadeira precisa dar a volta pelo corredor C
    "C05": (26, 26),
    "E03": (42, 42),
    "F10": (34, 34),
    "Saida": (38, 38),
}

# Vértices do interior dos corredores A, B, D e F: só o acesso manual chega.
SO_MANUAL = [f"{c}{p:02d}" for c in "ABDF" for p in range(2, 10)]


def test_distancias_conhecidas():
    for vertice, (manual, empilhadeira) in ESPERADO.items():
        assert calcular_rota(GRAFOS, "Entrada", vertice, "manual")["distancia"] == manual
        assert calcular_rota(GRAFOS, "Entrada", vertice, "empilhadeira")["distancia"] == empilhadeira


def test_empilhadeira_nao_chega_ao_interior_dos_corredores_manuais():
    assert len(SO_MANUAL) == 32
    for vertice in SO_MANUAL:
        assert calcular_rota(GRAFOS, "Entrada", vertice, "manual") is not None
        assert calcular_rota(GRAFOS, "Entrada", vertice, "empilhadeira") is None


def test_empilhadeira_alcanca_30_vertices():
    distancias, _ = menores_caminhos(GRAFOS, "Entrada", "empilhadeira")
    assert len(distancias) == 30
    assert not set(SO_MANUAL) & set(distancias)


def test_empilhadeira_nao_usa_arestas_so_manuais():
    so_manual = [(a["origem"], a["destino"]) for a in DADOS["arestas"] if a["acesso"] == ["manual"]]
    for origem, destino in so_manual:
        assert not GRAFOS["empilhadeira"].has_edge(origem, destino)
        assert GRAFOS["manual"].has_edge(origem, destino)


def test_grafo_manual_e_conexo():
    assert nx.is_connected(GRAFOS["manual"])


def test_dados_consistentes():
    ids = {v["id"] for v in DADOS["vertices"]}
    assert len(DADOS["vertices"]) == 62 and len(DADOS["arestas"]) == 66
    for aresta in DADOS["arestas"]:
        assert aresta["origem"] in ids and aresta["destino"] in ids
        assert aresta["distancia"] > 0
        assert aresta["acesso"] and set(aresta["acesso"]) <= {"manual", "empilhadeira"}
    for vertice in DADOS["vertices"]:
        if vertice["tipo"] == "corredor":
            assert vertice["id"] == f"{vertice['corredor']}{vertice['posicao']:02d}"
            assert vertice["corredor"] in DADOS["corredores"]


def test_dijkstra_didatico_igual_ao_networkx():
    for tipo, grafo in GRAFOS.items():
        for origem in grafo.nodes:
            for destino in grafo.nodes:
                esperado = calcular_rota(GRAFOS, origem, destino, tipo)
                obtido = dijkstra_didatico(grafo, origem, destino)
                if esperado is None:
                    assert obtido is None, f"{tipo}: {origem} -> {destino}"
                else:
                    assert obtido["distancia"] == esperado["distancia"], f"{tipo}: {origem} -> {destino}"


def test_vertice_inexistente():
    try:
        calcular_rota(GRAFOS, "Entrada", "XX", "manual")
    except ValueError:
        return
    raise AssertionError("Era esperado ValueError para vértice inexistente")


def test_vertice_da_posicao():
    assert vertice_da_posicao(DADOS, "C", 5) == "C05"
    assert vertice_da_posicao(DADOS, "f", 10) == "F10"
    for corredor, posicao in [("Z", 1), ("A", 0), ("A", 11)]:
        try:
            vertice_da_posicao(DADOS, corredor, posicao)
        except ErroDeDados:
            continue
        raise AssertionError(f"Era esperado ErroDeDados para {corredor}-{posicao}")


def test_normalizar_vertice():
    assert normalizar_vertice("c-05") == "C05"
    assert normalizar_vertice("C-05-P2") == "C05"
    assert normalizar_vertice("A1") == "A01"
    assert normalizar_vertice("C05") == "C05"
    assert normalizar_vertice("entrada") == "Entrada"
    assert normalizar_vertice("Saída") == "Saida"
    assert normalizar_vertice("XX") == "XX"


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
