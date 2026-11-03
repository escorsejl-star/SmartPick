var pickRate = [35, 95, 150, 200, 235, 255, 205, 235, 255, 275];
var horas = ['06h', '07h', '08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h'];

var eficiencia = [55, 52, 60, 56, 70, 78, 85, 91];
var semanas = ['Sem -4', 'Sem -3', 'Sem -2', 'Sem -1', 'Lançamento', 'Sem +1', 'Sem +2', 'Hoje'];

var API = 'http://localhost:5000';

var coresPrateleiras = ['#f5b400', '#38c8f5', '#10d9a0', '#a78bfa', '#ff8a5c', '#5b8fd6'];

var zonas = [];
var atividades = [];

function textoAtividade(a) {
  var coletor = a.coletor || 'sem coletor';
  if (a.status == 'Concluído') {
    return { texto: a.codigo + ' concluído · ' + a.itens + ' itens · ' + coletor, cor: 'cor-verde' };
  }
  if (a.status == 'Em Andamento') {
    return { texto: a.codigo + ' em coleta · ' + a.progresso + '% · ' + coletor, cor: 'cor-azul' };
  }
  if (a.status == 'Iniciado') {
    return { texto: a.codigo + ' iniciado · ' + a.cliente + ' · ' + coletor, cor: 'cor-azul' };
  }
  return { texto: a.codigo + ' aguardando coletor · ' + a.cliente, cor: 'cor-amarelo' };
}

function carregarOverview() {
  fetch(API + '/overview')
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (dados) {
      var ativos = dados.totalPedidos - dados.concluidos;
      document.getElementById('k-ativos').innerHTML = ativos;
      document.getElementById('k-ativos-detalhe').innerHTML = dados.concluidos + ' concluídos · ' + dados.emAndamento + ' em andamento';
      document.getElementById('k-acuracia').innerHTML = dados.totalPedidos + ' pedidos · 0 erros hoje';
      document.getElementById('subtitulo').innerHTML = dados.pendentes + ' pedidos pendentes · ' + dados.coletoresAtivos + ' coletores ativos';

      zonas = [];
      for (var i = 0; i < dados.prateleiras.length; i++) {
        var p = dados.prateleiras[i];
        zonas.push({
          nome: 'Prateleira ' + p.prateleira + ' – Corredor ' + p.corredor,
          ativos: p.ocupadas + '/' + p.total + ' posições',
          pct: Math.round((p.ocupadas / p.total) * 100),
          cor: coresPrateleiras[i % coresPrateleiras.length]
        });
      }

      atividades = [];
      for (var j = 0; j < dados.atividades.length; j++) {
        var a = dados.atividades[j];
        var linha = textoAtividade(a);
        atividades.push({ hora: a.hora, texto: linha.texto, cor: linha.cor });
      }

      desenharZonas();
      desenharAtividade();
    })
    .catch(function () {
      document.getElementById('subtitulo').innerHTML = 'Não foi possível carregar os dados. A API está rodando?';
    });
}

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
carregarOverview();
