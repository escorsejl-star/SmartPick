var pedidos = [
  { id: 'ORD-2251', cliente: 'Magazine Luiza', itens: 8, peso: 12.4, prio: 'P1', coletor: 'Carlos M.', status: 'Em Andamento', eta: '16:10', prog: 50 },
  { id: 'ORD-2252', cliente: 'Americanas S.A.', itens: 14, peso: 8.2, prio: 'P1', coletor: 'Ana P.', status: 'Iniciado', eta: '16:45', prog: 14 },
  { id: 'ORD-2253', cliente: 'Shopee Brasil', itens: 3, peso: 3.1, prio: 'P2', coletor: 'Marcos S.', status: 'Concluído', eta: '15:30', prog: 100 },
  { id: 'ORD-2254', cliente: 'Mercado Livre', itens: 21, peso: 24.8, prio: 'P1', coletor: 'Juliana F.', status: 'Em Andamento', eta: '17:00', prog: 33 },
  { id: 'ORD-2255', cliente: 'TOTVS Dist.', itens: 6, peso: 5.6, prio: 'P2', coletor: 'Carlos M.', status: 'Concluído', eta: '15:12', prog: 100 },
  { id: 'ORD-2256', cliente: 'Lojas Renner', itens: 18, peso: 9.4, prio: 'P2', coletor: 'Pedro A.', status: 'Iniciado', eta: '17:30', prog: 6 },
  { id: 'ORD-2257', cliente: 'Tok&Stok', itens: 4, peso: 38.2, prio: 'P1', coletor: 'Juliana F.', status: 'Em Andamento', eta: '16:20', prog: 75 },
  { id: 'ORD-2258', cliente: 'iFood Mercado', itens: 11, peso: 7.8, prio: 'P3', coletor: '—', status: 'Pendente', eta: '18:00', prog: 0 },
  { id: 'ORD-2259', cliente: 'B2W Digital', itens: 9, peso: 6.1, prio: 'P2', coletor: '—', status: 'Pendente', eta: '18:15', prog: 0 },
  { id: 'ORD-2260', cliente: 'Via Varejo', itens: 7, peso: 4.9, prio: 'P3', coletor: '—', status: 'Pendente', eta: '18:30', prog: 0 }
];

var proximoNumero = 2261;
var filtroStatus = 'Todos';
var paginaAtual = 1;
var pedidosPorPagina = 5;

var classeStatus = {
  'Em Andamento': 's-andamento',
  'Iniciado': 's-iniciado',
  'Concluído': 's-concluido',
  'Pendente': 's-pendente'
};

var corpo = document.getElementById('corpo');
var campoBusca = document.getElementById('busca');
var paginas = document.getElementById('paginas');

function mostrarTabela() {
  var texto = campoBusca.value.toLowerCase();
  var filtrados = [];
  var html = '';

  for (var i = 0; i < pedidos.length; i++) {
    var p = pedidos[i];

    if (filtroStatus != 'Todos' && p.status != filtroStatus) {
      continue;
    }

    var tudo = (p.id + ' ' + p.cliente).toLowerCase();
    if (tudo.indexOf(texto) == -1) {
      continue;
    }

    filtrados.push({ pedido: p, indice: i });
  }

  var totalPaginas = Math.ceil(filtrados.length / pedidosPorPagina);
  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }
  if (paginaAtual < 1) {
    paginaAtual = 1;
  }

  var inicio = (paginaAtual - 1) * pedidosPorPagina;
  var fim = inicio + pedidosPorPagina;
  for (var j = inicio; j < fim && j < filtrados.length; j++) {
    var p = filtrados[j].pedido;
    var indice = filtrados[j].indice;
    html = html + '<tr class="linha" onclick="abrirPedido(' + indice + ')">';
    html = html + '<td class="mono cod">' + p.id + '</td>';
    html = html + '<td><b>' + p.cliente + '</b></td>';
    html = html + '<td>' + p.itens + '</td>';
    html = html + '<td class="mono">' + p.peso + 'kg</td>';
    html = html + '<td><span class="chip p-' + p.prio + '">' + p.prio + '</span></td>';
    html = html + '<td>' + p.coletor + '</td>';
    html = html + '<td><span class="chip ' + classeStatus[p.status] + '">' + p.status + '</span></td>';
    html = html + '<td class="mono">' + p.eta + '</td>';
    html = html + '<td><div class="prog"><div class="barra-fundo"><div class="barra-cheia ' + corDaBarra(p) + '" style="width:' + p.prog + '%"></div></div>' + p.prog + '%</div></td>';
    html = html + '</tr>';
  }

  corpo.innerHTML = html;
  document.getElementById('contagem').innerHTML = filtrados.length + ' de ' + pedidos.length + ' pedidos';

  var htmlPaginas = '';
  for (var k = 1; k <= totalPaginas; k++) {
    var classe = '';
    if (k == paginaAtual) {
      classe = ' class="ativo"';
    }
    htmlPaginas = htmlPaginas + '<button' + classe + ' data-pagina="' + k + '">' + k + '</button>';
  }
  paginas.innerHTML = htmlPaginas;
}

function corDaBarra(p) {
  if (p.status == 'Concluído') return 'verde-bg';
  if (p.status == 'Iniciado') return 'azul-bg';
  return '';
}

function mostrarResumo() {
  var concluidos = 0;
  var andamento = 0;
  var pendentes = 0;

  for (var i = 0; i < pedidos.length; i++) {
    if (pedidos[i].status == 'Concluído') {
      concluidos = concluidos + 1;
    } else if (pedidos[i].status == 'Pendente') {
      pendentes = pendentes + 1;
    } else {
      andamento = andamento + 1;
    }
  }

  document.getElementById('r-total').innerHTML = pedidos.length;
  document.getElementById('r-concluidos').innerHTML = concluidos;
  document.getElementById('r-andamento').innerHTML = andamento;
  document.getElementById('r-pendentes').innerHTML = pendentes;
}

function abrirPedido(i) {
  var p = pedidos[i];
  alert(p.id + '\nCliente: ' + p.cliente + '\nItens: ' + p.itens + '\nStatus: ' + p.status + '\nETA: ' + p.eta);
}

var botoesFiltro = document.querySelectorAll('#filtros button');
for (var i = 0; i < botoesFiltro.length; i++) {
  botoesFiltro[i].addEventListener('click', function () {
    for (var j = 0; j < botoesFiltro.length; j++) {
      botoesFiltro[j].classList.remove('ativo');
    }
    this.classList.add('ativo');
    filtroStatus = this.innerHTML;
    paginaAtual = 1;
    mostrarTabela();
  });
}

paginas.addEventListener('click', function (e) {
  if (e.target.dataset.pagina) {
    paginaAtual = Number(e.target.dataset.pagina);
    mostrarTabela();
  }
});

campoBusca.addEventListener('input', function () {
  paginaAtual = 1;
  mostrarTabela();
});

document.getElementById('btnNovo').addEventListener('click', function () {
  var cliente = prompt('Nome do cliente:');
  if (cliente == null || cliente == '') {
    return;
  }

  pedidos.push({
    id: 'ORD-' + proximoNumero,
    cliente: cliente,
    itens: 1,
    peso: 1.0,
    prio: 'P3',
    coletor: '—',
    status: 'Pendente',
    eta: '19:00',
    prog: 0
  });
  proximoNumero = proximoNumero + 1;

  paginaAtual = 1;
  mostrarResumo();
  mostrarTabela();
});

mostrarResumo();
mostrarTabela();
