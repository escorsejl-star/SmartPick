"""Gera o desenho do grafo do armazém (docs/grafo_armazem.png).

Precisa do matplotlib (só para gerar a imagem, não é usado pela API):
    pip install matplotlib
    python desenhar_grafo.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx

from prototipo_rota import carregar_dados

# Posições dos vértices no desenho (x, y), apenas para a imagem.
POSICOES = {
    "L1": (100, 90), "T1": (270, 90), "T2": (410, 90), "R1": (580, 90),
    "L2": (100, 215), "M1": (270, 215), "M2": (410, 215), "R2": (580, 215),
    "L3": (100, 340), "B1": (270, 340), "B2": (410, 340), "R3": (580, 340),
    "Entrada": (100, 415), "Saida": (580, 415),
}

# Prateleiras desenhadas como retângulos: (x, y, largura, altura)
PRATELEIRAS = {
    "P1": (150, 112, 100, 81), "P2": (290, 112, 100, 81), "P3": (430, 112, 100, 81),
    "P4": (150, 237, 100, 81), "P5": (290, 237, 100, 81), "P6": (430, 237, 100, 81),
}


def main():
    dados = carregar_dados()
    pos = {v: (x, -y) for v, (x, y) in POSICOES.items()}

    grafo = nx.Graph()
    largas, estreitas, rotulos = [], [], {}
    for aresta in dados["arestas"]:
        origem, destino = aresta["origem"], aresta["destino"]
        grafo.add_edge(origem, destino)
        rotulos[(origem, destino)] = aresta["distancia"]
        (largas if "empilhadeira" in aresta["acesso"] else estreitas).append((origem, destino))

    figura, eixo = plt.subplots(figsize=(11, 8.5))

    for nome, (x, y, largura, altura) in PRATELEIRAS.items():
        eixo.add_patch(plt.Rectangle((x, -(y + altura)), largura, altura,
                                     facecolor="#EDEDED", edgecolor="#888780", linewidth=1))
        eixo.text(x + largura / 2, -(y + altura / 2), f"{nome}\nacesso: {dados['prateleiras'][nome]}",
                  ha="center", va="center", fontsize=10)

    nx.draw_networkx_edges(grafo, pos, edgelist=largas, width=3, edge_color="#5F5E5A", ax=eixo)
    nx.draw_networkx_edges(grafo, pos, edgelist=estreitas, width=3, edge_color="#BA7517",
                           style="dashed", ax=eixo)
    nx.draw_networkx_edge_labels(grafo, pos, edge_labels=rotulos, font_size=9, ax=eixo, rotate=False,
                                 bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "#B4B2A9"})

    corredores = [v for v in grafo.nodes if v not in ("Entrada", "Saida")]
    nx.draw_networkx_nodes(grafo, pos, nodelist=corredores, node_color="#9FE1CB",
                           edgecolors="#0F6E56", node_size=900, ax=eixo)
    nx.draw_networkx_nodes(grafo, pos, nodelist=["Entrada", "Saida"], node_color="#D3D1C7",
                           edgecolors="#5F5E5A", node_size=2200, node_shape="s", ax=eixo)
    nx.draw_networkx_labels(grafo, pos, font_size=10, font_weight="bold", ax=eixo)

    eixo.plot([], [], color="#5F5E5A", linewidth=3, label="Corredor largo (manual e empilhadeira)")
    eixo.plot([], [], color="#BA7517", linewidth=3, linestyle="--", label="Passagem estreita (só manual)")
    eixo.legend(loc="lower center", bbox_to_anchor=(0.5, -0.06), ncol=2, frameon=False)
    eixo.set_title("SmartPick: grafo do armazém (distâncias em metros, valores de exemplo)")
    eixo.set_aspect("equal")
    eixo.axis("off")

    destino = Path(__file__).parent / "docs" / "grafo_armazem.png"
    figura.savefig(destino, dpi=150, bbox_inches="tight")
    print(f"Imagem salva em {destino}")


if __name__ == "__main__":
    main()
