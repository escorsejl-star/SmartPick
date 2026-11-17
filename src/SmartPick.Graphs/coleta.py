"""Rota de coleta por várias paradas (usada pela tela do mapa).

Calcula o caminho que passa por uma lista de paradas, na ordem informada ou em
uma ordem melhorada pelo vizinho mais próximo (heurística simples: a cada passo,
vai para a parada pendente mais perto).
"""

from prototipo_rota import (
    TIPOS_ACESSO,
    ErroDeDados,
    menores_caminhos,
    vertice_da_posicao,
)

ORIGEM_PADRAO = "Entrada"
SAIDA = "Saida"


def rota_por_paradas(grafos, dados, paradas, tipo, origem=ORIGEM_PADRAO,
                     otimizar=False, terminar_na_saida=True):
    """Calcula a rota que sai da origem e passa por todas as paradas.

    paradas: lista de dicionários com "corredor" e "posicao".
    Levanta ErroDeDados se a lista for vazia, se uma parada não existir ou se
    o tipo de acesso não alcançar alguma parada.
    """
    if tipo not in TIPOS_ACESSO:
        raise ErroDeDados(f"Tipo de acesso inválido: {tipo}")
    if not paradas:
        raise ErroDeDados("Informe ao menos uma parada")

    pendentes = []
    for parada in paradas:
        corredor = str(parada["corredor"]).strip().upper()
        vertice = vertice_da_posicao(dados, corredor, parada["posicao"])
        pendentes.append({"corredor": corredor, "posicao": parada["posicao"], "vertice": vertice})

    # Como o grafo é não direcionado, o que a origem alcança todas as paradas alcançam.
    distancias, _ = menores_caminhos(grafos, origem, tipo)
    for parada in pendentes:
        if parada["vertice"] not in distancias:
            raise ErroDeDados(
                f"O acesso {tipo} não chega à parada {parada['corredor']}-{parada['posicao']:02d}"
            )

    atual = origem
    ordem = []
    trechos = []
    while pendentes:
        distancias, caminhos = menores_caminhos(grafos, atual, tipo)
        if otimizar:
            proxima = min(pendentes, key=lambda p: distancias[p["vertice"]])
        else:
            proxima = pendentes[0]
        pendentes.remove(proxima)
        trechos.append({
            "de": atual,
            "para": proxima["vertice"],
            "distancia": distancias[proxima["vertice"]],
            "rota": caminhos[proxima["vertice"]],
        })
        ordem.append(proxima)
        atual = proxima["vertice"]

    if terminar_na_saida:
        distancias, caminhos = menores_caminhos(grafos, atual, tipo)
        if SAIDA not in distancias:
            raise ErroDeDados(f"O acesso {tipo} não chega à saída")
        trechos.append({"de": atual, "para": SAIDA, "distancia": distancias[SAIDA], "rota": caminhos[SAIDA]})

    rota = list(trechos[0]["rota"])
    for trecho in trechos[1:]:
        rota.extend(trecho["rota"][1:])

    return {
        "tipoAcesso": tipo,
        "otimizada": otimizar,
        "ordem": ordem,
        "trechos": trechos,
        "rota": rota,
        "distanciaTotal": sum(trecho["distancia"] for trecho in trechos),
    }
