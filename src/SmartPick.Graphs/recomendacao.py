"""Escolha da posição de armazenamento (Etapa 1 do SmartPick).

Para cada posição livre, calcula a rota até o corredor da prateleira e soma
penalidades. A posição de menor custo é a recomendada.

As regras seguem docs/regras_de_negocio.md. Os valores abaixo são sugestões a
confirmar com o grupo: para mudar o comportamento, basta alterar as constantes.
"""

from prototipo_rota import calcular_rota

ORIGEM_PADRAO = "Entrada"

# Caixa com peso maior ou igual a este valor é considerada pesada (RN01).
LIMITE_PESADA_KG = 20

# Do nível 3 para cima só se chega com empilhadeira (RN03).
NIVEL_EMPILHADEIRA = 3

# Penalidades em "metros equivalentes", somadas à distância da rota.
# Chave = nível. Nível ausente = proibido para esse tipo de caixa.
PENALIDADE_NIVEL_LEVE = {1: 5, 2: 2, 3: 0}
PENALIDADE_NIVEL_PESADA = {1: 0, 2: 3}
PENALIDADE_EMPILHADEIRA = 10

MENSAGEM_SEM_POSICAO = "Nenhuma posição disponível para esta caixa"


class ErroDeDados(ValueError):
    """Dados do pedido que não batem com o armazém (ex.: prateleira inexistente)."""


def eh_pesada(peso_kg):
    return peso_kg >= LIMITE_PESADA_KG


def tipo_de_acesso(nivel, restrita=False):
    """Define o acesso da posição: empilhadeira se for alta ou restrita (RN03)."""
    if restrita or nivel >= NIVEL_EMPILHADEIRA:
        return "empilhadeira"
    return "manual"


def penalidade_de_nivel(peso_kg, nivel):
    """Penalidade do nível para o peso da caixa, ou None se for proibido."""
    tabela = PENALIDADE_NIVEL_PESADA if eh_pesada(peso_kg) else PENALIDADE_NIVEL_LEVE
    return tabela.get(nivel)


def escolher_posicao(grafos, dados, peso_kg, posicoes_livres, origem=ORIGEM_PADRAO):
    """Escolhe a melhor posição entre as livres.

    posicoes_livres: lista de dicionários com "id", "prateleira", "nivel" e,
    opcionalmente, "restrita" (True/False).

    Devolve um dicionário com a posição escolhida, o tipo de acesso, a rota e o
    custo, ou None se nenhuma posição servir.
    """
    prateleiras = dados["prateleiras"]
    melhor = None

    for posicao in posicoes_livres:
        prateleira = posicao["prateleira"]
        if prateleira not in prateleiras:
            raise ErroDeDados(f"Prateleira inexistente: {prateleira}")

        nivel = posicao["nivel"]
        pen_nivel = penalidade_de_nivel(peso_kg, nivel)
        if pen_nivel is None:
            continue  # nível proibido para esta caixa

        acesso = tipo_de_acesso(nivel, posicao.get("restrita", False))
        resultado = calcular_rota(grafos, origem, prateleiras[prateleira], acesso)
        if resultado is None:
            continue  # sem caminho para este tipo de acesso

        custo = resultado["distancia"] + pen_nivel
        if acesso == "empilhadeira":
            custo += PENALIDADE_EMPILHADEIRA

        candidata = {
            "posicaoId": posicao["id"],
            "prateleira": prateleira,
            "nivel": nivel,
            "tipoAcesso": acesso,
            "distancia": resultado["distancia"],
            "custo": custo,
            "rota": resultado["rota"],
        }
        # Desempate: menor custo, depois menor distância, depois menor id.
        chave = (custo, resultado["distancia"], posicao["id"])
        if melhor is None or chave < melhor[0]:
            melhor = (chave, candidata)

    return melhor[1] if melhor else None
