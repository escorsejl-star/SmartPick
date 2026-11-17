var API = 'http://localhost:5000';

var posicoes = [];     // todas as posições do armazém (vem de /mapa)
var pedidos = [];      // pedidos em andamento (vem de /pedidos)
var itensPedidos = []; // produtos de cada pedido (vem de /pedidos/itens)

// ---------- Planta do armazém ----------
// A planta é montada pela quantidade de prateleiras que vem do banco: 3 por
// fileira, com um corredor em volta de cada uma. Os corredores formam uma
// grade de pontos (coluna, linha), como no grafo do SmartPick.Graphs.
var POR_FILEIRA = 3;
var PASSO_X = 150;  // distância entre dois corredores na horizontal
var PASSO_Y = 100;  // e na vertical
var MARGEM = 40;
var METROS = 8;     // metros entre dois pontos vizinhos da grade

var nomesPrateleiras = [];
var fileiras = 0;

function montarLayout() {
  nomesPrateleiras = [];
  for (var i = 0; i < posicoes.length; i++) {
    if (nomesPrateleiras.indexOf(posicoes[i].prateleira) == -1) {
      nomesPrateleiras.push(posicoes[i].prateleira);
    }
  }
  fileiras = Math.ceil(nomesPrateleiras.length / POR_FILEIRA);
}

function pontoX(col) { return MARGEM + col * PASSO_X; }
function pontoY(lin) { return MARGEM + lin * PASSO_Y; }

// Ponto do corredor por onde se acessa a prateleira: as fileiras de cima são
// acessadas pelo corredor de cima, as de baixo pelo corredor de baixo.
function acessoDaPrateleira(nome) {
  var i = nomesPrateleiras.indexOf(nome);
  var fileira = Math.floor(i / POR_FILEIRA);
  var lin = fileira;
  if (fileira >= fileiras / 2) lin = fileira + 1;
  return { col: (i % POR_FILEIRA) + 1, lin: lin };
}

function entrada() { return { col: 0, lin: fileiras }; }
function saida() { return { col: POR_FILEIRA, lin: fileiras }; }

// Regra do padrão: nível 3, posição restrita ou produto pesado pede empilhadeira
function tipoAcesso(nivel, restrita, pesoKg) {
  if (nivel == 3 || restrita || pesoKg >= 20) return 'Empilhadeira';
  return 'Manual';
}

function seloAcesso(tipo) {
  return '<span class="selo-acesso ' + tipo.toLowerCase() + '">' + tipo + '</span>';
}

function posicoesDaPrateleira(prateleira) {
  var lista = [];
  for (var i = 0; i < posicoes.length; i++) {
    if (posicoes[i].prateleira == prateleira) lista.push(posicoes[i]);
  }
  return lista;
}

// A zona da prateleira é a categoria dos produtos guardados nela
function zonaDaPrateleira(prateleira) {
  var lista = posicoesDaPrateleira(prateleira);
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].categoria) return lista[i].categoria;
  }
  return 'Vazia';
}

// Desenha a planta em SVG. "rota" é opcional: quando vem, mostra o caminho do pedido
function desenharPlanta(idDiv, rota) {
  var largura = MARGEM * 2 + POR_FILEIRA * PASSO_X;
  var altura = MARGEM * 2 + fileiras * PASSO_Y + 30;
  var xFim = pontoX(POR_FILEIRA);
  var yFim = pontoY(fileiras);
  var svg = '<svg viewBox="0 0 ' + largura + ' ' + altura + '" style="max-width:' + largura + 'px">';

  // paredes
  svg += '<rect x="12" y="12" width="' + (largura - 24) + '" height="' + (yFim + 16) + '" rx="6" fill="#081230" stroke="#22407a" stroke-width="2"/>';

  // corredores largos (a pé e empilhadeira): todas as linhas e as duas laterais
  var largo = 'stroke="#0c1c44" stroke-width="22" stroke-linecap="round"';
  for (var l = 0; l <= fileiras; l++) {
    svg += '<line x1="' + MARGEM + '" y1="' + pontoY(l) + '" x2="' + xFim + '" y2="' + pontoY(l) + '" ' + largo + '/>';
  }
  svg += '<line x1="' + MARGEM + '" y1="' + MARGEM + '" x2="' + MARGEM + '" y2="' + (yFim + 30) + '" ' + largo + '/>';
  svg += '<line x1="' + xFim + '" y1="' + MARGEM + '" x2="' + xFim + '" y2="' + (yFim + 30) + '" ' + largo + '/>';
  // passagens estreitas (só a pé): as colunas do meio
  for (var c = 1; c < POR_FILEIRA; c++) {
    svg += '<line x1="' + pontoX(c) + '" y1="' + MARGEM + '" x2="' + pontoX(c) + '" y2="' + yFim + '" stroke="#0c1c44" stroke-width="8"/>';
  }

  // entrada e saída
  svg += '<text x="' + MARGEM + '" y="' + (altura - 4) + '" text-anchor="middle" fill="#10d9a0" font-size="10" font-weight="bold">ENTRADA</text>';
  svg += '<text x="' + xFim + '" y="' + (altura - 4) + '" text-anchor="middle" fill="#ff8a8a" font-size="10" font-weight="bold">SAÍDA</text>';

  // prateleiras
  var w = PASSO_X - 40;
  var h = PASSO_Y - 36;
  for (var n = 0; n < nomesPrateleiras.length; n++) {
    var nome = nomesPrateleiras[n];
    var x = pontoX(n % POR_FILEIRA) + 20;
    var y = pontoY(Math.floor(n / POR_FILEIRA)) + 18;
    var lista = posicoesDaPrateleira(nome);
    var ocupadas = 0;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].ocupada) ocupadas++;
    }
    var borda = '#3d68b8';
    if (rota && rota.numeros[nome]) borda = '#f5b400';

    svg += '<g class="planta-prateleira" onclick="abrirPrateleira(\'' + nome + '\')">';
    svg += '<rect class="corpo" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="#17336b" stroke="' + borda + '" stroke-width="2"/>';
    svg += '<text x="' + (x + 9) + '" y="' + (y + 20) + '" fill="white" font-size="14" font-weight="bold">' + nome + '</text>';
    svg += '<text x="' + (x + w - 9) + '" y="' + (y + 19) + '" text-anchor="end" fill="#8fb0e0" font-size="10">' + ocupadas + '/' + lista.length + '</text>';
    svg += '<text x="' + (x + 9) + '" y="' + (y + 36) + '" fill="#f5b400" font-size="10">' + zonaDaPrateleira(nome) + '</text>';
    // barra de ocupação
    svg += '<rect x="' + (x + 9) + '" y="' + (y + 46) + '" width="' + (w - 18) + '" height="6" rx="3" fill="#0a1a3d"/>';
    svg += '<rect x="' + (x + 9) + '" y="' + (y + 46) + '" width="' + ((w - 18) * ocupadas / lista.length) + '" height="6" rx="3" fill="#f5b400"/>';
    svg += '</g>';
  }

  if (rota) {
    // caminho do pedido
    var pontos = '';
    for (var p = 0; p < rota.pontos.length; p++) {
      pontos += rota.pontos[p].x + ',' + rota.pontos[p].y + ' ';
    }
    svg += '<polyline points="' + pontos + '" fill="none" stroke="#f5b400" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round"/>';

    // paradas numeradas, no ponto de acesso de cada prateleira
    for (var k = 0; k < rota.paradas.length; k++) {
      var parada = rota.paradas[k];
      var a = acessoDaPrateleira(parada.prateleira);
      var cor = '#f5b400';
      if (parada.feita) cor = '#10d9a0';
      svg += '<circle cx="' + pontoX(a.col) + '" cy="' + pontoY(a.lin) + '" r="10" fill="' + cor + '"/>';
      svg += '<text x="' + pontoX(a.col) + '" y="' + (pontoY(a.lin) + 4) + '" text-anchor="middle" fill="#0a1330" font-size="11" font-weight="bold">' + (k + 1) + '</text>';
    }
  }

  svg += '</svg>';
  document.getElementById(idDiv).innerHTML = svg;
}

// ---------- Rota de um pedido ----------

// Distância em metros andando pela grade de corredores
function distancia(de, para) {
  return (Math.abs(de.col - para.col) + Math.abs(de.lin - para.lin)) * METROS;
}

// Junta os produtos do pedido por prateleira e decide a ordem das paradas.
// A ordem é sempre "a parada mais perto de onde estou". Quando o serviço de
// grafos for ligado, a rota otimizada vem dele.
function montarRota(pedido) {
  var grupos = {};
  var semPosicao = [];
  for (var i = 0; i < itensPedidos.length; i++) {
    var item = itensPedidos[i];
    if (item.pedidoId != pedido.id) continue;
    if (!item.prateleira) {
      semPosicao.push(item);
      continue;
    }
    if (!grupos[item.prateleira]) grupos[item.prateleira] = [];
    grupos[item.prateleira].push(item);
  }

  var paradas = [];
  var atual = entrada();
  var metros = 4; // da porta de entrada até o primeiro corredor
  var pontos = [{ x: pontoX(0), y: pontoY(fileiras) + 30 }, { x: pontoX(0), y: pontoY(fileiras) }];

  while (Object.keys(grupos).length > 0) {
    var perto = null;
    for (var nome in grupos) {
      if (perto == null || distancia(atual, acessoDaPrateleira(nome)) < distancia(atual, acessoDaPrateleira(perto))) {
        perto = nome;
      }
    }
    var destino = acessoDaPrateleira(perto);
    metros += distancia(atual, destino);
    pontos.push({ x: pontoX(destino.col), y: pontoY(atual.lin) });
    pontos.push({ x: pontoX(destino.col), y: pontoY(destino.lin) });
    paradas.push({ prateleira: perto, itens: grupos[perto], feita: false });
    delete grupos[perto];
    atual = destino;
  }

  metros += distancia(atual, saida()) + 4;
  pontos.push({ x: pontoX(POR_FILEIRA), y: pontoY(atual.lin) });
  pontos.push({ x: pontoX(POR_FILEIRA), y: pontoY(fileiras) + 30 });

  // Marca o que já foi coletado, seguindo o progresso do pedido
  var coletados = Math.round(pedido.progresso * pedido.itens / 100);
  var numeros = {};
  var achouAtual = false;
  for (var p = 0; p < paradas.length; p++) {
    numeros[paradas[p].prateleira] = p + 1;
    var tudoFeito = true;
    for (var j = 0; j < paradas[p].itens.length; j++) {
      var it = paradas[p].itens[j];
      it.feito = coletados >= it.quantidade;
      if (it.feito) {
        coletados -= it.quantidade;
      } else {
        coletados = 0;
        tudoFeito = false;
      }
    }
    paradas[p].feita = tudoFeito;
    paradas[p].atual = false;
    if (!tudoFeito && !achouAtual) {
      achouAtual = true;
      paradas[p].atual = true;
    }
  }

  return { paradas: paradas, pontos: pontos, numeros: numeros, metros: metros, semPosicao: semPosicao };
}

// ---------- Janela do coletor ----------

function abrirColetor(indice) {
  var pedido = pedidos[indice];
  var rota = montarRota(pedido);

  document.getElementById('coletorTitulo').innerHTML = (pedido.coletor || 'Sem coletor') + ' · ' + pedido.codigo;
  document.getElementById('coletorResumo').innerHTML = pedido.cliente + ' · ' + pedido.itens + ' itens · ' + pedido.pesoKg + ' kg · ' +
    pedido.progresso + '% coletado · ' + rota.paradas.length + ' paradas · cerca de ' + rota.metros + ' m';

  var html = '';
  for (var p = 0; p < rota.paradas.length; p++) {
    var parada = rota.paradas[p];
    var classe = 'parada';
    var situacao = 'A coletar';
    if (parada.feita) {
      classe = 'parada feita';
      situacao = '<span class="verde">Coletado</span>';
    } else if (parada.atual) {
      classe = 'parada atual';
      situacao = '<span class="amarelo">Coletando agora</span>';
    }

    html += '<div class="' + classe + '"><h5><span>' + (p + 1) + ' · Prateleira ' + parada.prateleira + '</span>' + situacao + '</h5>';
    for (var j = 0; j < parada.itens.length; j++) {
      var item = parada.itens[j];
      html += '<div class="parada-produto"><div><b>' + item.quantidade + 'x ' + item.descricao + '</b>' +
        '<small>' + item.posicao + ' · ' + item.pesoKg + ' kg' + (item.feito ? ' · coletado' : '') + '</small></div>' +
        '<div>' + seloAcesso(tipoAcesso(item.nivel, item.restrita, item.pesoKg)) + '</div></div>';
    }
    html += '</div>';
  }
  if (rota.semPosicao.length > 0) {
    html += '<p class="sub">' + rota.semPosicao.length + ' produto(s) deste pedido ainda não foram armazenados.</p>';
  }
  if (rota.paradas.length == 0 && rota.semPosicao.length == 0) {
    html = '<p class="sub">Este pedido não tem produtos cadastrados.</p>';
  }
  document.getElementById('coletorParadas').innerHTML = html;

  desenharPlanta('coletorPlanta', rota);
  document.getElementById('modalColetor').hidden = false;
}

// ---------- Janela da prateleira (vista de frente) ----------

// "destaque" é opcional: o código da posição que deve aparecer destacada
function abrirPrateleira(nome, destaque) {
  var lista = posicoesDaPrateleira(nome);
  if (lista.length == 0) return;

  document.getElementById('prateleiraTitulo').innerHTML = 'Prateleira ' + nome + ' · ' + zonaDaPrateleira(nome) + ' · corredor ' + lista[0].corredor;

  var rotulos = { 3: 'empilhadeira', 2: 'manual', 1: 'chão' };
  var html = '<div class="rack"><div class="rack-cabeca"><span></span><span>Frente</span><span>Fundo</span></div>';

  // a lista vem do nível 3 para o 1, com frente e fundo de cada nível
  for (var i = 0; i < lista.length; i++) {
    var po = lista[i];
    if (po.profundidade == 1) {
      html += '<div class="rack-nivel"><span class="rack-rotulo">N' + po.nivel + '<small>' + rotulos[po.nivel] + '</small></span>';
    }

    if (po.ocupada) {
      var classe = 'rack-caixa';
      if (po.pesoKg >= 20) classe += ' pesada';
      if (po.codigo == destaque) classe += ' destaque';
      html += '<div class="' + classe + '" title="' + po.codigo + '"><b>' + po.caixa + '</b>' +
        '<span>' + po.descricao + '<br>' + po.pesoKg + ' kg · ' + po.quantidade + ' un.</span>' +
        seloAcesso(tipoAcesso(po.nivel, po.restrita, po.pesoKg)) + '</div>';
    } else if (po.restrita) {
      html += '<div class="rack-vazio restrita">livre · restrita</div>';
    } else {
      html += '<div class="rack-vazio">livre</div>';
    }

    if (po.profundidade == 2) {
      html += '</div>';
    }
  }
  html += '</div>';

  document.getElementById('prateleiraDesenho').innerHTML = html;
  document.getElementById('modalColetor').hidden = true;
  document.getElementById('modalPrateleira').hidden = false;
}

function fecharJanelas() {
  document.getElementById('modalPrateleira').hidden = true;
  document.getElementById('modalColetor').hidden = true;
}

// clicar fora da janela também fecha
document.getElementById('modalPrateleira').addEventListener('click', function (e) {
  if (e.target == this) fecharJanelas();
});
document.getElementById('modalColetor').addEventListener('click', function (e) {
  if (e.target == this) fecharJanelas();
});

// ---------- Lista de coletores, números e tabela ----------

function mostrarColetores() {
  var html = '';
  for (var i = 0; i < pedidos.length; i++) {
    var p = pedidos[i];
    html += '<div class="coletor" onclick="abrirColetor(' + i + ')">' +
      '<div class="coletor-linha"><strong>' + (p.coletor || 'Sem coletor') + '</strong><span class="mono">' + p.codigo + '</span></div>' +
      '<div class="barra-fundo"><div class="barra-cheia" style="width:' + p.progresso + '%"></div></div>' +
      '<div class="coletor-linha" style="margin:8px 0 0 0"><span>' + p.cliente + ' · ' + p.itens + ' itens</span><span class="amarelo">' + p.progresso + '%</span></div>' +
      '</div>';
  }
  if (html == '') {
    html = '<p class="sub">Nenhum pedido em coleta agora.</p>';
  }
  document.getElementById('listaColetores').innerHTML = html;
}

function mostrarNumeros() {
  var ocupadas = 0;
  var empilhadeira = 0;
  for (var i = 0; i < posicoes.length; i++) {
    var po = posicoes[i];
    if (!po.ocupada) continue;
    ocupadas++;
    if (tipoAcesso(po.nivel, po.restrita, po.pesoKg) == 'Empilhadeira') empilhadeira++;
  }

  document.getElementById('s-total').innerHTML = posicoes.length;
  document.getElementById('s-ocupadas').innerHTML = ocupadas;
  document.getElementById('s-livres').innerHTML = posicoes.length - ocupadas;
  document.getElementById('s-empilhadeira').innerHTML = empilhadeira;
  document.getElementById('subtitulo').innerHTML = nomesPrateleiras.length + ' prateleiras · ' + posicoes.length + ' posições · clique em uma prateleira para ver por dentro';
}

var POR_PAGINA = 10;
var pagina = 1;

function mostrarItens() {
  var texto = document.getElementById('busca').value.toLowerCase();

  // primeiro separa os itens que batem com a busca
  var lista = [];
  for (var i = 0; i < posicoes.length; i++) {
    var po = posicoes[i];
    if (!po.ocupada) continue;
    var tudo = (po.caixa + ' ' + po.descricao + ' ' + po.categoria + ' ' + po.codigo).toLowerCase();
    if (tudo.indexOf(texto) != -1) lista.push(po);
  }

  var paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  if (pagina > paginas) pagina = paginas;
  var inicio = (pagina - 1) * POR_PAGINA;

  var html = '';
  for (var j = inicio; j < inicio + POR_PAGINA && j < lista.length; j++) {
    var item = lista[j];
    html += '<tr onclick="abrirPrateleira(\'' + item.prateleira + '\', \'' + item.codigo + '\')">' +
      '<td class="mono amarelo">' + item.caixa + '</td>' +
      '<td>' + item.descricao + '</td>' +
      '<td>' + item.categoria + '</td>' +
      '<td class="mono">' + item.codigo + '</td>' +
      '<td>' + item.pesoKg + ' kg</td>' +
      '<td>' + item.quantidade + '</td>' +
      '<td>' + seloAcesso(tipoAcesso(item.nivel, item.restrita, item.pesoKg)) + '</td></tr>';
  }
  if (html == '') {
    html = '<tr><td colspan="7">Nenhum item encontrado.</td></tr>';
  }
  document.getElementById('itens').innerHTML = html;

  document.getElementById('paginaTexto').innerHTML = 'Página ' + pagina + ' de ' + paginas + ' · ' + lista.length + ' itens';
  document.getElementById('btnAnterior').disabled = pagina == 1;
  document.getElementById('btnProxima').disabled = pagina == paginas;
}

function mudarPagina(passo) {
  pagina = pagina + passo;
  mostrarItens();
}

document.getElementById('busca').addEventListener('input', function () {
  pagina = 1;
  mostrarItens();
});

// ---------- Carregar os dados ----------

function buscar(caminho) {
  return fetch(API + caminho).then(function (resposta) {
    return resposta.json();
  });
}

function carregarTudo() {
  Promise.all([buscar('/mapa'), buscar('/pedidos'), buscar('/pedidos/itens')])
    .then(function (dados) {
      posicoes = dados[0];
      itensPedidos = dados[2];

      // só os pedidos que têm alguém coletando
      pedidos = [];
      for (var i = 0; i < dados[1].length; i++) {
        var p = dados[1][i];
        if (p.status == 'Iniciado' || p.status == 'Em Andamento') pedidos.push(p);
      }

      montarLayout();
      desenharPlanta('planta', null);
      mostrarColetores();
      mostrarNumeros();
      mostrarItens();
    })
    .catch(function () {
      document.getElementById('subtitulo').innerHTML = 'Não foi possível carregar o mapa. A API está rodando?';
    });
}

carregarTudo();
