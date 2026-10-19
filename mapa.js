var corredores = ['A', 'B', 'C', 'D', 'E', 'F'];

var paradas = [
  { c: 'A', p: 3, l: 0 }, { c: 'A', p: 7, l: 0 },
  { c: 'B', p: 2, l: 1 }, { c: 'B', p: 8, l: 1 },
  { c: 'C', p: 5, l: 1 }, { c: 'D', p: 1, l: 1 },
  { c: 'D', p: 6, l: 1 }, { c: 'E', p: 9, l: 1 },
  { c: 'F', p: 3, l: 1 }, { c: 'F', p: 7, l: 1 }
];

var coletores = [
  { nome: 'Carlos M.', pos: 'C-5', pedido: 'ORD-2251', prog: 50 },
  { nome: 'Ana P.', pos: 'A-7', pedido: 'ORD-2253', prog: 75 },
  { nome: 'Marcos S.', pos: 'D-1', pedido: 'ORD-2256', prog: 12 },
  { nome: 'Juliana F.', pos: 'F-7', pedido: 'ORD-2257', prog: 91 }
];

var atual = 4;

function posX(corredor, lado) {
  return 60 + corredor * 165 + lado * 56;
}
function posY(linha) {
  return 40 + (linha - 1) * 38;
}

function indiceCorredor(letra) {
  return corredores.indexOf(letra);
}

function estado(i) {
  if (i < atual) return 'feito';
  if (i == atual) return 'agora';
  return 'pendente';
}

function desenharPlanta() {
  var html = '';


  for (var i = 0; i < corredores.length; i++) {
    html = html + '<div class="letra" style="left:' + (posX(i, 0) + 45) + 'px;top:0">' + corredores[i] + '</div>';
  }
  for (var n = 1; n <= 10; n++) {
    html = html + '<div class="numero" style="left:10px;top:' + (posY(n) + 5) + 'px">' + (n < 10 ? '0' + n : n) + '</div>';
  }


  for (var c = 0; c < corredores.length; c++) {
    for (var lado = 0; lado < 2; lado++) {
      for (var linha = 1; linha <= 10; linha++) {

        var classe = 'celula';
        var clique = '';
        for (var k = 0; k < paradas.length; k++) {
          if (paradas[k].c == corredores[c] && paradas[k].p == linha && paradas[k].l == lado) {
            classe = 'celula ' + estado(k);
            clique = ' onclick="irParaParada(' + k + ')"';
          }
        }

        html = html + '<div class="' + classe + '"' + clique + ' style="left:' + posX(c, lado) + 'px;top:' + posY(linha) + 'px"></div>';
      }
    }
  }

  var pontos = '';
  var bolinhas = '';
  for (var j = 0; j < paradas.length; j++) {
    var x = posX(indiceCorredor(paradas[j].c), paradas[j].l) + 25;
    var y = posY(paradas[j].p) + 15;
    pontos = pontos + x + ',' + y + ' ';

    var cor = '#c9a227';
    var raio = 6;
    if (estado(j) == 'feito') cor = '#10d9a0';
    if (estado(j) == 'agora') {
      cor = '#f5b400';
      raio = 10;
      bolinhas = bolinhas + '<circle cx="' + x + '" cy="' + y + '" r="16" fill="none" stroke="#f5b400" stroke-width="2" opacity="0.4"/>';
    }
    bolinhas = bolinhas + '<circle cx="' + x + '" cy="' + y + '" r="' + raio + '" fill="' + cor + '"/>';
  }

  html = html + '<svg id="rotaSvg" width="1040" height="440">' +
    '<polyline points="' + pontos + '" fill="none" stroke="#f5b400" stroke-width="2.5" stroke-dasharray="7 5"/>' +
    bolinhas + '</svg>';

  document.getElementById('planta').innerHTML = html;
}

function desenharLista() {
  var html = '';
  for (var i = 0; i < paradas.length; i++) {
    var classe = 'parada-item';
    var icone = i + 1;
    if (i < atual) {
      classe = 'parada-item feito';
      icone = '✓';
    }
    if (i == atual) {
      classe = 'parada-item agora';
    }
    html = html + '<div class="' + classe + '" onclick="irParaParada(' + i + ')"><i>' + icone + '</i>Corredor ' + paradas[i].c + ' · P' + paradas[i].p + '</div>';
  }
  document.getElementById('listaParadas').innerHTML = html;
}

function desenharColetores() {
  var html = '';
  for (var i = 0; i < coletores.length; i++) {
    var c = coletores[i];
    html = html + '<div class="coletor">' +
      '<div class="coletor-linha"><strong>' + c.nome + '</strong><span class="mono">' + c.pos + '</span></div>' +
      '<div class="barra-fundo"><div class="barra-cheia" style="width:' + c.prog + '%"></div></div>' +
      '<div class="coletor-linha" style="margin:8px 0 0 0"><span>' + c.pedido + '</span><span class="amarelo">' + c.prog + '%</span></div>' +
      '</div>';
  }
  document.getElementById('listaColetores').innerHTML = html;
}

function atualizarNumeros() {
  var restantes = paradas.length - atual;
  var distRestante = Math.round(restantes * 14.67);

  document.getElementById('m-prog').innerHTML = (atual + 1) + '/' + paradas.length;
  document.getElementById('m-barra').style.width = ((atual + 1) * 10) + '%';
  document.getElementById('m-dist').innerHTML = '148m';
  document.getElementById('s-coletados').innerHTML = atual;
  document.getElementById('s-pendentes').innerHTML = restantes;
  document.getElementById('s-dist').innerHTML = distRestante + 'm';
}

function irParaParada(i) {
  atual = i;
  console.log('parada atual: ' + (i + 1));
  atualizarTudo();
}

function atualizarTudo() {
  desenharPlanta();
  desenharLista();
  atualizarNumeros();
}

desenharColetores();
atualizarTudo();
