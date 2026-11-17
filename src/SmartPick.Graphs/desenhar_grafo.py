"""Gera o desenho do grafo do armazém (docs/grafo_armazem.png).

Precisa do matplotlib (só para gerar a imagem, não é usado pela API):
    pip install matplotlib
    python desenhar_grafo.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from prototipo_rota import carregar_dados

ESPACO_X = 3.0   # distância horizontal entre corredores, só para o desenho


def posicao_no_desenho(dados):
    """Coordenadas (x, y) de cada vértice no desenho."""
    ultima = dados["posicoesPorCorredor"]
    pos = {}
    for indice, corredor in enumerate(dados["corredores"]):
        for posicao in range(1, ultima + 1):
            pos[f"{corredor}{posicao:02d}"] = (indice * ESPACO_X, -posicao)
    pos["Entrada"] = (0, -(ultima + 2))
    pos["Saida"] = ((len(dados["corredores"]) - 1) * ESPACO_X, -(ultima + 2))
    return pos


def main():
    dados = carregar_dados()
    pos = posicao_no_desenho(dados)
    ultima = dados["posicoesPorCorredor"]

    figura, eixo = plt.subplots(figsize=(11, 9.5))

    # Prateleiras: faixas dos dois lados de cada corredor.
    for indice, corredor in enumerate(dados["corredores"]):
        x = indice * ESPACO_X
        for lado in (-1, 1):
            esquerda = x + (0.18 if lado == 1 else -0.18 - 0.6)
            eixo.add_patch(plt.Rectangle((esquerda, -ultima - 0.4), 0.6, ultima - 0.2,
                                         facecolor="#EDEDED", edgecolor="#B4B2A9", linewidth=0.8))
        eixo.text(x, 0.1, f"Corredor {corredor}", ha="center", va="bottom", fontsize=11, fontweight="bold")

    for aresta in dados["arestas"]:
        (x1, y1), (x2, y2) = pos[aresta["origem"]], pos[aresta["destino"]]
        so_manual = aresta["acesso"] == ["manual"]
        eixo.plot([x1, x2], [y1, y2], color="#BA7517" if so_manual else "#2F6F5E",
                  linewidth=2.2, linestyle="--" if so_manual else "-", zorder=2)
        # Distância só nos trechos transversais e nas ligações da entrada e da saída.
        if x1 != x2 or "Entrada" in (aresta["origem"], aresta["destino"]) or "Saida" in (aresta["origem"], aresta["destino"]):
            eixo.text((x1 + x2) / 2, (y1 + y2) / 2, str(aresta["distancia"]), ha="center", va="center",
                      fontsize=8, zorder=4, bbox={"boxstyle": "round,pad=0.15", "fc": "white", "ec": "#B4B2A9"})

    for vertice in dados["vertices"]:
        x, y = pos[vertice["id"]]
        if vertice["tipo"] == "corredor":
            eixo.scatter([x], [y], s=210, color="#9FE1CB", edgecolors="#0F6E56", linewidths=1, zorder=3)
            eixo.text(x, y, str(vertice["posicao"]), ha="center", va="center", fontsize=7, zorder=5)
        else:
            eixo.scatter([x], [y], s=1500, color="#D3D1C7", edgecolors="#5F5E5A", marker="s", zorder=3)
            eixo.text(x, y, "Entrada" if vertice["tipo"] == "entrada" else "Saída",
                      ha="center", va="center", fontsize=9, fontweight="bold", zorder=5)

    eixo.plot([], [], color="#2F6F5E", linewidth=2.2, label="Manual e empilhadeira (corredores C e E, transversais, entrada e saída)")
    eixo.plot([], [], color="#BA7517", linewidth=2.2, linestyle="--", label="Só manual (corredores A, B, D e F)")
    eixo.legend(loc="lower center", bbox_to_anchor=(0.5, -0.07), frameon=False, fontsize=9)
    eixo.set_title("SmartPick: grafo do armazém (layout do front-end; distâncias em metros, valores de exemplo)", fontsize=11, pad=34)
    eixo.text(0.5, -0.115, f"Distância entre posições vizinhas: {dados['arestas'][2]['distancia']} m. "
                           "Números nos vértices = posição no corredor.",
              transform=eixo.transAxes, ha="center", fontsize=8, color="#5F5E5A")
    eixo.set_aspect("equal")
    eixo.axis("off")

    destino = Path(__file__).parent / "docs" / "grafo_armazem.png"
    figura.savefig(destino, dpi=150, bbox_inches="tight")
    print(f"Imagem salva em {destino}")


if __name__ == "__main__":
    main()
