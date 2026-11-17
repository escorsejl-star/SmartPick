"""Testes da escolha da posição.

Rodam com Python puro ou com pytest:
    python test_recomendacao.py
    pytest
"""

from prototipo_rota import ErroDeDados, carregar_dados, montar_grafos
from recomendacao import escolher_posicao, formatar_endereco, tipo_de_acesso

DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)


def pos(id_, corredor, posicao, nivel, restrita=False):
    return {"id": id_, "corredor": corredor, "posicao": posicao, "nivel": nivel, "restrita": restrita}


# Posição A-10 (a 4 m da Entrada) nos níveis 1, 2 e 3.
A10_TRES_NIVEIS = [pos(1, "A", 10, 1), pos(2, "A", 10, 2), pos(3, "A", 10, 3)]


def test_caixa_leve_escolhe_nivel_2():
    # Nível 1: 4 + 5 = 9. Nível 2: 4 + 2 = 6. Nível 3: 4 + 0 + 10 = 14.
    r = escolher_posicao(GRAFOS, DADOS, 8, A10_TRES_NIVEIS)
    assert r["posicaoId"] == 2
    assert r["custo"] == 6
    assert r["tipoAcesso"] == "manual"
    assert r["classeNivel"] == "GROUND"
    assert r["endereco"] == "A-10-P2"
    assert r["distancia"] == 4
    assert r["rota"] == ["Entrada", "A10"]


def test_caixa_pesada_escolhe_nivel_1():
    # Nível 1: 4 + 0 = 4. Nível 2: 4 + 3 = 7. Nível 3: proibido.
    r = escolher_posicao(GRAFOS, DADOS, 30, A10_TRES_NIVEIS)
    assert r["posicaoId"] == 1
    assert r["custo"] == 4


def test_caixa_pesada_nunca_vai_para_nivel_alto():
    for nivel in (3, 4, 5):
        assert escolher_posicao(GRAFOS, DADOS, 30, [pos(1, "C", 5, nivel)]) is None


def test_nivel_alto_em_corredor_de_empilhadeira():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(7, "C", 5, 4)])
    assert r["tipoAcesso"] == "empilhadeira"
    assert r["classeNivel"] == "HIGH"
    assert r["endereco"] == "C-05-P4"
    assert r["distancia"] == 26
    assert r["custo"] == 36          # 26 + 0 + 10


def test_nivel_alto_em_corredor_so_manual_nao_serve():
    # A empilhadeira não entra no corredor B, então a posição não pode ser usada.
    assert escolher_posicao(GRAFOS, DADOS, 8, [pos(1, "B", 5, 4)]) is None


def test_posicao_restrita_exige_empilhadeira():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(1, "C", 5, 1, restrita=True)])
    assert r["tipoAcesso"] == "empilhadeira"
    assert r["custo"] == 41          # 26 + 5 + 10


def test_sem_posicoes_livres():
    assert escolher_posicao(GRAFOS, DADOS, 8, []) is None


def test_posicao_inexistente():
    invalidas = [pos(1, "Z", 1, 1), pos(1, "A", 11, 1), pos(1, "A", 0, 1), pos(1, "A", 1, 6), pos(1, "A", 1, 0)]
    for invalida in invalidas:
        try:
            escolher_posicao(GRAFOS, DADOS, 8, [invalida])
        except ErroDeDados:
            continue
        raise AssertionError(f"Era esperado ErroDeDados para {invalida}")


def test_posicao_invalida_e_detectada_mesmo_com_outra_valida():
    try:
        escolher_posicao(GRAFOS, DADOS, 30, [pos(1, "A", 10, 1), pos(2, "Z", 1, 1)])
    except ErroDeDados:
        return
    raise AssertionError("Era esperado ErroDeDados")


def test_desempate_escolhe_menor_id():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(5, "A", 10, 2), pos(4, "A", 10, 2)])
    assert r["posicaoId"] == 4


def test_prefere_posicao_mais_proxima():
    r = escolher_posicao(GRAFOS, DADOS, 8, [pos(1, "F", 10, 2), pos(2, "A", 10, 2)])
    assert r["corredor"] == "A"


def test_tipo_de_acesso():
    assert tipo_de_acesso(1) == "manual"
    assert tipo_de_acesso(2) == "manual"
    assert tipo_de_acesso(3) == "empilhadeira"
    assert tipo_de_acesso(5) == "empilhadeira"
    assert tipo_de_acesso(1, restrita=True) == "empilhadeira"


def test_formatar_endereco():
    assert formatar_endereco("A", 3, 1) == "A-03-P1"
    assert formatar_endereco("F", 10, 5) == "F-10-P5"


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
