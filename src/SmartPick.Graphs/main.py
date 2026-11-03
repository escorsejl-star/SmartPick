"""API de grafos e rotas do SmartPick (FastAPI).

Como rodar (na pasta SmartPick.Graphs, com o ambiente virtual ativado):
    pip install -r requirements.txt
    uvicorn main:app --reload

Depois abra http://127.0.0.1:8000/docs para testar os endpoints no navegador.
"""

from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from prototipo_rota import calcular_rota, carregar_dados, montar_grafos
from recomendacao import MENSAGEM_SEM_POSICAO, ErroDeDados, escolher_posicao

app = FastAPI(title="SmartPick - Grafos e Rotas", version="0.1.0")

# Os grafos são montados uma vez, quando a API inicia.
DADOS = carregar_dados()
GRAFOS = montar_grafos(DADOS)

TipoAcesso = Literal["manual", "empilhadeira"]


# Os nomes dos campos seguem o contrato de dados (docs/regras_de_negocio.md).
class Dimensoes(BaseModel):
    alturaCm: float = Field(gt=0)
    larguraCm: float = Field(gt=0)
    profundidadeCm: float = Field(gt=0)


class PosicaoLivre(BaseModel):
    id: int
    prateleira: str
    nivel: int = Field(ge=1)
    restrita: bool = False


class PedidoRecomendacao(BaseModel):
    pesoKg: float = Field(gt=0)
    dimensoes: Optional[Dimensoes] = None  # ainda não usado no cálculo
    posicoesDisponiveis: List[PosicaoLivre]


@app.get("/saude")
def saude():
    """Confere se o serviço está no ar."""
    return {"status": "ok"}


@app.get("/rota")
def rota(origem: str, destino: str, tipo: TipoAcesso):
    """Menor caminho entre dois vértices, para o acesso manual ou da empilhadeira."""
    try:
        resultado = calcular_rota(GRAFOS, origem, destino, tipo)
    except ValueError as erro:
        raise HTTPException(status_code=404, detail=str(erro))
    if resultado is None:
        raise HTTPException(status_code=404, detail="Não existe caminho entre os vértices informados")
    return resultado


@app.post("/recomendar")
def recomendar(pedido: PedidoRecomendacao):
    """Escolhe a melhor posição entre as livres e devolve o acesso e a rota."""
    posicoes = [posicao.model_dump() for posicao in pedido.posicoesDisponiveis]
    try:
        resultado = escolher_posicao(GRAFOS, DADOS, pedido.pesoKg, posicoes)
    except ErroDeDados as erro:
        raise HTTPException(status_code=422, detail=str(erro))
    if resultado is None:
        return {"posicaoId": None, "mensagem": MENSAGEM_SEM_POSICAO}
    return resultado
