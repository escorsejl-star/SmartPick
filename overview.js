var pickRate = [35, 95, 150, 200, 235, 255, 205, 235, 255, 275];
var horas = ['06h', '07h', '08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h'];

var eficiencia = [55, 52, 60, 56, 70, 78, 85, 91];
var semanas = ['Sem -4', 'Sem -3', 'Sem -2', 'Sem -1', 'Lançamento', 'Sem +1', 'Sem +2', 'Hoje'];

var zonas = [
  { nome: 'Zona A – Calçados', ativos: '3 ativos', pct: 72, cor: '#f5b400' },
  { nome: 'Zona B – Eletro', ativos: '2 ativos', pct: 58, cor: '#38c8f5' },
  { nome: 'Zona C – Vestuário', ativos: '1 ativos', pct: 85, cor: '#10d9a0' },
  { nome: 'Zona D – Acessórios', ativos: '', pct: 40, cor: '#a78bfa' }
];

var atividades = [
  { hora: '15:44', texto: 'ORD-2255 concluído · 6 itens · Carlos M.', cor: 'cor-verde' },
  { hora: '15:38', texto: 'ORD-2251 · Posição B-14 em coleta · Ana P.', cor: 'cor-azul' },
  { hora: '15:31', texto: 'Divergência detectada em ORD-2249 · Lote incorreto', cor: 'cor-vermelho' },
  { hora: '15:20', texto: 'ORD-2248 concluído · 12 itens · Marcos S.', cor: 'cor-verde' },
  { hora: '15:10', texto: 'Rota reotimizada ORD-2252 · -4 corredores', cor: 'cor-amarelo' }
];

function desenharGrafico(idSvg, valores, maximo, cor, comFundo) {
  var pontos = '';
  var total = valores.length;

  for (var i = 0; i < total; i++) {
    var x = i * (600 / (total - 1));
    var y = 200 - (valores[i] / maximo) * 200;
    pontos = pontos + x + ',' + y + ' ';
  }

  var html = '';
  if (comFundo) {
    html = html + '<polygon points="0,200 ' + pontos + '600,200" fill="' + cor + '" opacity="0.15"/>';
  }
  html = html + '<polyline points="' + pontos + '" fill="none" stroke="' + cor + '" stroke-width="3" vector-effect="non-scaling-stroke"/>';

  document.getElementById(idSvg).innerHTML = html;
}

function desenharEixo(idDiv, textos) {
  var html = '';
  for (var i = 0; i < textos.length; i++) {
    html = html + '<span>' + textos[i] + '</span>';
  }
  document.getElementById(idDiv).innerHTML = html;
}

function desenharZonas() {
  var html = '';
  for (var i = 0; i < zonas.length; i++) {
    var z = zonas[i];
    html = html + '<div class="zona">' +
      '<div class="zona-linha"><span><span style="color:' + z.cor + '">●</span> ' + z.nome + '</span><small>' + z.ativos + ' <b>' + z.pct + '%</b></small></div>' +
      '<div class="barra-fundo"><div class="barra-cheia" style="width:' + z.pct + '%;background:' + z.cor + '"></div></div>' +
      '</div>';
  }
  document.getElementById('zonas').innerHTML = html;
}

function desenharAtividade() {
  var html = '';
  for (var i = 0; i < atividades.length; i++) {
    var a = atividades[i];
    html = html + '<li class="' + a.cor + '"><span>' + a.hora + '</span>' + a.texto + '</li>';
  }
  document.getElementById('atividade').innerHTML = html;
}

desenharGrafico('grafico1', pickRate, 280, '#f5b400', true);
desenharEixo('eixo1', horas);
desenharGrafico('grafico2', eficiencia, 100, '#38c8f5', false);
desenharEixo('eixo2', semanas);
desenharZonas();
desenharAtividade();
