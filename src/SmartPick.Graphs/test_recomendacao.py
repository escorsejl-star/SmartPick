"""Testes da escolha da posição.

Rodam com Python puro ou com pytest:
    python test_recomendacao.py
    pytest
"""

from prototipo_rota import carregar_dados, montar_grafos
from recomendacao import ErroDeDados, escolher_posicao, tipo_de_acesso

DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)


def pos(id_, prateleira, nivel, restrita=False):
    return {"id": id_, "prateleira": prateleira, "nivel": nivel, "restrita": restrita}


P4_TRES_NIVEIS = [pos(1, "P4", 1), pos(2, "P4", 2), pos(3, "P4", 3)]


def test_caixa_leve_escolhe_nivel_2():
    # Nível 1: 12 + 5 = 17. Nível 2: 12 + 2 = 14. Nível 3: 12 + 0 + 10 = 22.
    r = escolher_posicao(GRAFOS, DADOS, 8, P4_TRES_NIVEIS)
    assert r["posicaoId"] == 2
    assert r["custo"] == 14
    assert r["tipoAcesso"] == "manual"
    assert r["distancia"] == 12
    assert r["rota"] == ["Entrada", "L3", "B1"]


def test_caixa_pesada_escolhe_nivel_1():
    # Nível 1: 12 + 0 = 12. Nível 2: 12 + 3 = 15. Nível 3: proibido.
    r = escolher_posicao(GRAFOS, DADOS, 30, P4_TRES_NIVEIS)
    assert r["posicaoId"] == 1
    assert r["custo"] == 12


def test_caixa_pesada_nunca_vai_para_nivel_3():
    assert escolher_posicao(GRAFOS, DADOS, 30, [pos(3, "P4", 3)]) is None


def test_nivel_3_usa_empilhadeira():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(7, "P1", 3)])
    assert r["tipoAcesso"] == "empilhadeira"
    assert r["distancia"] == 28          # rota da empilhadeira até T1
    assert r["custo"] == 38              # 28 + 0 + 10


def test_posicao_restrita_exige_empilhadeira():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(1, "P4", 1, restrita=True)])
    assert r["tipoAcesso"] == "empilhadeira"
    assert r["custo"] == 27              # 12 + 5 + 10


def test_sem_posicoes_livres():
    assert escolher_posicao(GRAFOS, DADOS, 8, []) is None


def test_prateleira_inexistente():
    try:
        escolher_posicao(GRAFOS, DADOS, 8, [pos(1, "P99", 1)])
    except ErroDeDados:
        return
    raise AssertionError("Era esperado ErroDeDados")


def test_desempate_escolhe_menor_id():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(5, "P4", 2), pos(4, "P4", 2)])
    assert r["posicaoId"] == 4


def test_prefere_posicao_mais_proxima():
    # Mesmo nível: P4 (12 m) custa menos que P6 (27 m).
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(1, "P6", 2), pos(2, "P4", 2)])
    assert r["prateleira"] == "P4"


def test_tipo_de_acesso():
    assert tipo_de_acesso(1) == "manual"
    assert tipo_de_acesso(2) == "manual"
    assert tipo_de_acesso(3) == "empilhadeira"
    assert tipo_de_acesso(1, restrita=True) == "empilhadeira"


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
