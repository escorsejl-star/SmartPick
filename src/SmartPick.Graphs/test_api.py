"""Testes dos endpoints da API.

Precisam do FastAPI e do httpx instalados (pip install -r requirements.txt).
Rodam com Python puro ou com pytest:
    python test_api.py
    pytest
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def posicao(id_, corredor, numero, nivel, restrita=False):
    return {"id": id_, "corredor": corredor, "posicao": numero, "nivel": nivel, "restrita": restrita}


def test_saude():
    resposta = client.get("/saude")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_cors_liberado_para_o_front_end():
    resposta = client.get("/saude", headers={"Origin": "http://localhost:5500"})
    assert resposta.headers["access-control-allow-origin"] == "*"


def test_armazem():
    dados = client.get("/armazem").json()
    assert dados["corredores"] == ["A", "B", "C", "D", "E", "F"]
    assert dados["posicoesPorCorredor"] == 10
    assert dados["niveis"] == 5
    assert len(dados["vertices"]) == 62
    assert dados["regras"]["limitePesadaKg"] == 20


def test_rota_aceita_endereco_do_front_end():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "C-05", "tipo": "manual"})
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["destino"] == "C05"
    assert dados["distancia"] == 26
    assert dados["rota"][0] == "Entrada" and dados["rota"][-1] == "C05"


def test_rota_empilhadeira_da_a_volta():
    manual = client.get("/rota", params={"origem": "Entrada", "destino": "A01", "tipo": "manual"}).json()
    empilhadeira = client.get("/rota", params={"origem": "Entrada", "destino": "A01", "tipo": "empilhadeira"}).json()
    assert manual["distancia"] == 22
    assert empilhadeira["distancia"] == 46


def test_rota_vertice_inexistente():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "XX", "tipo": "manual"})
    assert resposta.status_code == 404


def test_rota_sem_caminho_para_empilhadeira():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "B05", "tipo": "empilhadeira"})
    assert resposta.status_code == 404


def test_rota_tipo_invalido():
    resposta = client.get("/rota", params={"origem": "Entrada", "destino": "C05", "tipo": "bicicleta"})
    assert resposta.status_code == 422


def test_rota_paradas_na_ordem_informada():
    pedido = {"tipo": "manual", "paradas": [{"corredor": "C", "posicao": 5}, {"corredor": "A", "posicao": 3}]}
    resposta = client.post("/rota/paradas", json=pedido)
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["distanciaTotal"] == 98
    assert [t["para"] for t in dados["trechos"]] == ["C05", "A03", "Saida"]


def test_rota_paradas_otimizada():
    paradas = [{"corredor": "F", "posicao": 2}, {"corredor": "A", "posicao": 2}, {"corredor": "C", "posicao": 2}]
    resposta = client.post("/rota/paradas", json={"tipo": "manual", "otimizar": True, "paradas": paradas})
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["distanciaTotal"] == 78
    assert [p["corredor"] for p in dados["ordem"]] == ["A", "C", "F"]


def test_rota_paradas_sem_acesso_da_empilhadeira():
    pedido = {"tipo": "empilhadeira", "paradas": [{"corredor": "B", "posicao": 5}]}
    assert client.post("/rota/paradas", json=pedido).status_code == 422


def test_rota_paradas_lista_vazia():
    assert client.post("/rota/paradas", json={"tipo": "manual", "paradas": []}).status_code == 422


def test_recomendar_caixa_leve():
    pedido = {
        "pesoKg": 8,
        "dimensoes": {"comprimentoCm": 40, "larguraCm": 30, "alturaCm": 30},
        "posicoesDisponiveis": [posicao(1, "A", 10, 1), posicao(2, "A", 10, 2), posicao(3, "A", 10, 3)],
    }
    resposta = client.post("/recomendar", json=pedido)
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["posicaoId"] == 2
    assert dados["endereco"] == "A-10-P2"
    assert dados["tipoAcesso"] == "manual"
    assert dados["classeNivel"] == "GROUND"
    assert dados["custo"] == 6
    assert dados["rota"] == ["Entrada", "A10"]


def test_recomendar_nivel_alto_usa_empilhadeira():
    pedido = {"pesoKg": 8, "posicoesDisponiveis": [posicao(7, "C", 5, 4)]}
    dados = client.post("/recomendar", json=pedido).json()
    assert dados["tipoAcesso"] == "empilhadeira"
    assert dados["classeNivel"] == "HIGH"
    assert dados["endereco"] == "C-05-P4"


def test_recomendar_sem_posicao():
    pedido = {"pesoKg": 30, "posicoesDisponiveis": [posicao(3, "A", 10, 3)]}
    resposta = client.post("/recomendar", json=pedido)
    assert resposta.status_code == 200
    assert resposta.json()["posicaoId"] is None
    assert "Nenhuma posição" in resposta.json()["mensagem"]


def test_recomendar_posicao_inexistente():
    pedido = {"pesoKg": 8, "posicoesDisponiveis": [posicao(1, "Z", 1, 1)]}
    assert client.post("/recomendar", json=pedido).status_code == 422


def test_recomendar_peso_invalido():
    pedido = {"pesoKg": 0, "posicoesDisponiveis": []}
    assert client.post("/recomendar", json=pedido).status_code == 422


if __name__ == "__main__":
    testes = [(nome, fn) for nome, fn in globals().items() if nome.startswith("test_")]
    for nome, funcao in testes:
        funcao()
        print(f"ok  {nome}")
    print(f"\n{len(testes)} testes passaram.")
