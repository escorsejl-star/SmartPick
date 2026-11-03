"""Testes dos endpoints da API.

Precisam do FastAPI e do httpx instalados (pip install -r requirements.txt).
Rodam com Python puro ou com pytest:
    python test_api.py
    pytest
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_saude():
    resposta = client.get("/saude")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_rota_manual():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "T1", "tipo": "manual"})
    assert resposta.status_code == 200
    assert resposta.json()["distancia"] == 24


def test_rota_empilhadeira():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "T1", "tipo": "empilhadeira"})
    assert resposta.status_code == 200
    assert resposta.json()["distancia"] == 28


def test_rota_vertice_inexistente():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "XX", "tipo": "manual"})
    assert resposta.status_code == 404


def test_rota_tipo_invalido():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "T1", "tipo": "bicicleta"})
    assert resposta.status_code == 422


def test_recomendar_caixa_leve():
    pedido = {
        "pesoKg": 8,
        "posicoesDisponiveis": [
            {"id": 1, "prateleira": "P4", "nivel": 1},
            {"id": 2, "prateleira": "P4", "nivel": 2},
            {"id": 3, "prateleira": "P4", "nivel": 3},
        ],
    }
    resposta = client.post("/recomendar", json=pedido)
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["posicaoId"] == 2
    assert dados["tipoAcesso"] == "manual"
    assert dados["custo"] == 14
    assert dados["rota"] == ["Entrada", "L3", "B1"]


def test_recomendar_sem_posicao():
    pedido = {"pesoKg": 30, "posicoesDisponiveis": [{"id": 3, "prateleira": "P4", "nivel": 3}]}
    resposta = client.post("/recomendar", json=pedido)
    assert resposta.status_code == 200
    assert resposta.json()["posicaoId"] is None
    assert "Nenhuma posição" in resposta.json()["mensagem"]


def test_recomendar_prateleira_inexistente():
    pedido = {"pesoKg": 8, "posicoesDisponiveis": [{"id": 1, "prateleira": "P99", "nivel": 1}]}
    resposta = client.post("/recomendar", json=pedido)
    assert resposta.status_code == 422


def test_recomendar_peso_invalido():
    pedido = {"pesoKg": 0, "posicoesDisponiveis": []}
    resposta = client.post("/recomendar", json=pedido)
    assert resposta.status_code == 422


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
