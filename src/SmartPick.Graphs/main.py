"""API de grafos e rotas do SmartPick (FastAPI).

Como rodar (na pasta SmartPick.Graphs, com o ambiente virtual ativado):
    pip install -r requirements.txt
    python -m uvicorn main:app --reload --port 8001

Depois abra http://127.0.0.1:8001/docs para testar os endpoints no navegador.
O guia para as outras equipes está em docs/guia_integracao.md.
"""

import os
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import recomendacao
from coleta import rota_por_paradas
from prototipo_rota import (
    ErroDeDados,
    calcular_rota,
    carregar_dados,
    montar_grafos,
    normalizar_vertice,
)

app = FastAPI(
    title="SmartPick - Grafos e Rotas",
    version="0.2.0",
    description=(
        "Serviço de grafos do SmartPick: calcula rotas no armazém (acesso manual "
        "ou empilhadeira) e recomenda a posição de armazenamento de uma caixa."
    ),
)

# CORS: permite que o front-end (aberto no navegador) chame a API. Por padrão aceita
# qualquer origem, o que serve para desenvolvimento. Para restringir, defina a
# variável de ambiente SMARTPICK_CORS_ORIGENS, por exemplo "http://localhost:5500".
ORIGENS = [o.strip() for o in os.getenv("SMARTPICK_CORS_ORIGENS", "*").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=ORIGENS, allow_methods=["*"], allow_headers=["*"])

# Os grafos são montados uma vez, quando a API inicia.
DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)

TipoAcesso = Literal["manual", "empilhadeira"]


# Os nomes dos campos seguem o contrato de dados (docs/guia_integracao.md) e o
# catálogo do front-end (comprimento, largura, altura, peso, corredor, posição).
class Dimensoes(BaseModel):
    comprimentoCm: float = Field(gt=0)
    larguraCm: float = Field(gt=0)
    alturaCm: float = Field(gt=0)


class PosicaoLivre(BaseModel):
    id: int
    corredor: str = Field(min_length=1, max_length=1, description="Letra do corredor, de A a F")
    posicao: int = Field(ge=1, description="Posição no corredor, de 1 a 10")
    nivel: int = Field(ge=1, description="Nível da prateleira: 1 = P1 até 5 = P5")
    restrita: bool = Field(default=False, description="Posição restrita: exige empilhadeira")


class PedidoRecomendacao(BaseModel):
    pesoKg: float = Field(gt=0)
    dimensoes: Optional[Dimensoes] = None  # ainda não usado no cálculo
    posicoesDisponiveis: List[PosicaoLivre]


class Parada(BaseModel):
    corredor: str = Field(min_length=1, max_length=1)
    posicao: int = Field(ge=1)


class PedidoRotaParadas(BaseModel):
    tipo: TipoAcesso = "manual"
    otimizar: bool = Field(default=False, description="Reordena as paradas pelo vizinho mais próximo")
    terminarNaSaida: bool = Field(default=True, description="Inclui o trecho final até a Saída")
    paradas: List[Parada] = Field(min_length=1, max_length=200)


@app.get("/saude")
def saude():
    """Confere se o serviço está no ar."""
    return {"status": "ok"}


@app.get("/armazem")
def armazem():
    """Layout do armazém (vértices e arestas do grafo) e valores atuais das regras."""
    return {**DADOS, "regras": recomendacao.regras()}


@app.get("/rota")
def rota(origem: str, destino: str, tipo: TipoAcesso):
    """Menor caminho entre dois pontos, para o acesso manual ou da empilhadeira.

    Origem e destino aceitam o id do vértice (Entrada, Saida, C05) ou o endereço
    do front-end (C-05, C-05-P2).
    """
    origem = normalizar_vertice(origem)
    destino = normalizar_vertice(destino)
    try:
        resultado = calcular_rota(GRAFOS, origem, destino, tipo)
    except ValueError as erro:
        raise HTTPException(status_code=404, detail=str(erro))
    if resultado is None:
        raise HTTPException(status_code=404, detail="Não existe caminho entre os pontos informados")
    return {"origem": origem, "destino": destino, "tipoAcesso": tipo, **resultado}


@app.post("/rota/paradas")
def rota_paradas(pedido: PedidoRotaParadas):
    """Rota da Entrada passando por várias paradas (usada pela tela do mapa)."""
    paradas = [parada.model_dump() for parada in pedido.paradas]
    try:
        return rota_por_paradas(
            GRAFOS,
            DADOS,
            paradas,
            pedido.tipo,
            otimizar=pedido.otimizar,
            terminar_na_saida=pedido.terminarNaSaida,
        )
    except ErroDeDados as erro:
        raise HTTPException(status_code=422, detail=str(erro))


@app.post("/recomendar")
def recomendar(pedido: PedidoRecomendacao):
    """Escolhe a melhor posição entre as livres e devolve o acesso, a rota e o custo."""
    posicoes = [posicao.model_dump() for posicao in pedido.posicoesDisponiveis]
    try:
        resultado = recomendacao.escolher_posicao(GRAFOS, DADOS, pedido.pesoKg, posicoes)
    except ErroDeDados as erro:
        raise HTTPException(status_code=422, detail=str(erro))
    if resultado is None:
        return {"posicaoId": None, "mensagem": recomendacao.MENSAGEM_SEM_POSICAO}
    return resultado
