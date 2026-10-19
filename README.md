# SmartPick

Sistema de coleta e gestão de armazém (projeto de faculdade). Por enquanto roda só no front, sem back-end.

## Como rodar

Abrir o `index.html` no navegador, preencher qualquer ID e senha e entrar.

## Telas

| Tela | HTML | JS | CSS |
|------|------|----|-----|
| Login | index.html | script.js | style.css |
| Overview | overview.html | overview.js | app.css |
| Mapa do Armazém | mapa.html | mapa.js | app.css |
| Pedidos | pedidos.html | pedidos.js | app.css |
| Catálogo SKU | catalogo.html | catalogo.js | catalogo.css |

`menu.js` confere o login e monta o menu lateral nas telas Overview, Mapa, Pedidos e Catálogo SKU.

Na tela de Pedidos, a tabela mostra até cinco registros por página. A busca e os filtros voltam para a primeira página.

## O que falta fazer

- Portal do coletor
- Ligar login e dados com a API
