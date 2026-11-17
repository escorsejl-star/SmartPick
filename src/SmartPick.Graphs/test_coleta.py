"""Testes da rota por várias paradas.

Rodam com Python puro ou com pytest:
    python test_coleta.py
    pytest
"""

from coleta import rota_por_paradas
from prototipo_rota import ErroDeDados, carregar_dados, montar_grafos

DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)


def parada(corredor, posicao):
    return {"corredor": corredor, "posicao": posicao}


def test_rota_na_ordem_informada():
    r = rota_por_paradas(GRAFOS, DADOS, [parada("C", 5), parada("A", 3)], "manual")
    assert [t["para"] for t in r["trechos"]] == ["C05", "A03", "Saida"]
    assert [t["distancia"] for t in r["trechos"]] == [26, 24, 48]
    assert r["distanciaTotal"] == 98
    assert r["rota"][0] == "Entrada" and r["rota"][-1] == "Saida"
    assert r["otimizada"] is False


def test_rota_sem_terminar_na_saida():
    r = rota_por_paradas(GRAFOS, DADOS, [parada("C", 5)], "manual", terminar_na_saida=False)
    assert r["distanciaTotal"] == 26
    assert r["rota"][-1] == "C05"


def test_rota_continua_sem_vertices_repetidos_nas_emendas():
    r = rota_por_paradas(GRAFOS, DADOS, [parada("C", 5), parada("A", 3)], "manual")
    # Entre dois vértices vizinhos da rota existe aresta: não pode haver duplicata na emenda.
    assert all(a != b for a, b in zip(r["rota"], r["rota"][1:]))


def test_otimizar_reduz_a_distancia():
    paradas = [parada("F", 2), parada("A", 2), parada("C", 2)]
    fixa = rota_por_paradas(GRAFOS, DADOS, paradas, "manual")
    melhor = rota_por_paradas(GRAFOS, DADOS, paradas, "manual", otimizar=True)
    assert fixa["distanciaTotal"] == 138
    assert melhor["distanciaTotal"] == 78
    assert [p["corredor"] for p in melhor["ordem"]] == ["A", "C", "F"]
    assert melhor["otimizada"] is True


def test_parada_inexistente():
    try:
        rota_por_paradas(GRAFOS, DADOS, [parada("Z", 1)], "manual")
    except ErroDeDados:
        return
    raise AssertionError("Era esperado ErroDeDados")


def test_empilhadeira_sem_acesso_a_parada():
    try:
        rota_por_paradas(GRAFOS, DADOS, [parada("B", 5)], "empilhadeira")
    except ErroDeDados:
        return
    raise AssertionError("Era esperado ErroDeDados")


def test_empilhadeira_em_corredores_liberados():
    r = rota_por_paradas(GRAFOS, DADOS, [parada("C", 5), parada("E", 3)], "empilhadeira")
    assert r["tipoAcesso"] == "empilhadeira"
    assert r["distanciaTotal"] > 0


def test_lista_vazia_e_tipo_invalido():
    for argumentos in [([], "manual"), ([parada("C", 5)], "bicicleta")]:
        try:
            rota_por_paradas(GRAFOS, DADOS, argumentos[0], argumentos[1])
        except ErroDeDados:
            continue
        raise AssertionError(f"Era esperado ErroDeDados para {argumentos}")


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
