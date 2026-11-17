"""Escolha da posição de armazenamento (Etapa 1 do SmartPick).

Para cada posição livre, calcula a rota até o corredor da posição e soma
penalidades. A posição de menor custo é a recomendada.

As regras seguem docs/regras_de_negocio.md. Os valores abaixo são sugestões a
confirmar com o grupo: para mudar o comportamento, basta alterar as constantes.
"""

from prototipo_rota import (
    TIPOS_ACESSO,
    ErroDeDados,
    menores_caminhos,
    vertice_da_posicao,
)

ORIGEM_PADRAO = "Entrada"

# Caixa com peso maior ou igual a este valor é considerada pesada (RN01).
LIMITE_PESADA_KG = 20

# A partir deste nível (prateleira P3 em diante) só se chega com empilhadeira (RN03).
NIVEL_EMPILHADEIRA = 3

# Penalidades em "metros equivalentes", somadas à distância da rota.
# Chave = nível (prateleira P1 a P5). Nível ausente = proibido para esse tipo de caixa.
PENALIDADE_NIVEL_LEVE = {1: 5, 2: 2, 3: 0, 4: 0, 5: 0}
PENALIDADE_NIVEL_PESADA = {1: 0, 2: 3}
PENALIDADE_EMPILHADEIRA = 10

MENSAGEM_SEM_POSICAO = "Nenhuma posição disponível para esta caixa"


def eh_pesada(peso_kg):
    return peso_kg >= LIMITE_PESADA_KG


def tipo_de_acesso(nivel, restrita=False):
    """Define o acesso da posição: empilhadeira se for alta ou restrita (RN03)."""
    if restrita or nivel >= NIVEL_EMPILHADEIRA:
        return "empilhadeira"
    return "manual"


def classe_do_nivel(acesso):
    """Mesma classificação do catálogo do front-end: GROUND (manual) ou HIGH."""
    return "GROUND" if acesso == "manual" else "HIGH"


def penalidade_de_nivel(peso_kg, nivel):
    """Penalidade do nível para o peso da caixa, ou None se for proibido."""
    tabela = PENALIDADE_NIVEL_PESADA if eh_pesada(peso_kg) else PENALIDADE_NIVEL_LEVE
    return tabela.get(nivel)


def formatar_endereco(corredor, posicao, nivel):
    """Endereço no formato do catálogo do front-end: corredor-posição-prateleira."""
    return f"{corredor}-{posicao:02d}-P{nivel}"


def regras():
    """Valores atuais das regras (devolvidos pela API em GET /armazem)."""
    return {
        "limitePesadaKg": LIMITE_PESADA_KG,
        "nivelEmpilhadeira": NIVEL_EMPILHADEIRA,
        "penalidadeNivelLeve": PENALIDADE_NIVEL_LEVE,
        "penalidadeNivelPesada": PENALIDADE_NIVEL_PESADA,
        "penalidadeEmpilhadeira": PENALIDADE_EMPILHADEIRA,
    }


def escolher_posicao(grafos, dados, peso_kg, posicoes_livres, origem=ORIGEM_PADRAO):
    """Escolhe a melhor posição entre as livres.

    posicoes_livres: lista de dicionários com "id", "corredor", "posicao",
    "nivel" e, opcionalmente, "restrita" (True/False).

    Devolve um dicionário com a posição escolhida, o tipo de acesso, a rota e o
    custo, ou None se nenhuma posição servir. Levanta ErroDeDados se alguma
    posição não existir no armazém.
    """
    # Um Dijkstra por tipo de acesso serve para todas as posições do pedido.
    alcance = {tipo: menores_caminhos(grafos, origem, tipo) for tipo in TIPOS_ACESSO}
    melhor = None

    for posicao in posicoes_livres:
        corredor = str(posicao["corredor"]).strip().upper()
        vertice = vertice_da_posicao(dados, corredor, posicao["posicao"])
        nivel = posicao["nivel"]
        if not 1 <= nivel <= dados["niveis"]:
            raise ErroDeDados(f"Nível inexistente: {nivel} (de 1 a {dados['niveis']})")

        pen_nivel = penalidade_de_nivel(peso_kg, nivel)
        if pen_nivel is None:
            continue  # nível proibido para esta caixa

        acesso = tipo_de_acesso(nivel, posicao.get("restrita", False))
        distancias, caminhos = alcance[acesso]
        if vertice not in distancias:
            continue  # este acesso não chega ao corredor da posição

        distancia = distancias[vertice]
        custo = distancia + pen_nivel
        if acesso == "empilhadeira":
            custo += PENALIDADE_EMPILHADEIRA

        candidata = {
            "posicaoId": posicao["id"],
            "corredor": corredor,
            "posicao": posicao["posicao"],
            "nivel": nivel,
            "endereco": formatar_endereco(corredor, posicao["posicao"], nivel),
            "tipoAcesso": acesso,
            "classeNivel": classe_do_nivel(acesso),
            "distancia": distancia,
            "custo": custo,
            "rota": caminhos[vertice],
        }
        # Desempate: menor custo, depois menor distância, depois menor id.
        chave = (custo, distancia, posicao["id"])
        if melhor is None or chave < melhor[0]:
            melhor = (chave, candidata)

    return melhor[1] if melhor else None
