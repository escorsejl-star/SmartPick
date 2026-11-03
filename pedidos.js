var API = 'http://localhost:5000';

var pedidos = [];

function converterPedido(item) {
  return {
    numero: item.id,
    id: item.codigo,
    cliente: item.cliente,
    itens: item.itens,
    peso: item.pesoKg,
    prio: item.prioridade,
    coletor: item.coletor || '—',
    coletorOriginal: item.coletor || '',
    status: item.status,
    eta: item.eta || '—',
    etaOriginal: item.eta || '',
    prog: item.progresso
  };
}

function carregarPedidos() {
  fetch(API + '/pedidos')
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (itens) {
      pedidos = [];
      for (var i = 0; i < itens.length; i++) {
        pedidos.push(converterPedido(itens[i]));
      }
      mostrarResumo();
      mostrarTabela();
    })
    .catch(function () {
      corpo.innerHTML = '<tr><td colspan="9">Não foi possível carregar os pedidos. A API está rodando?</td></tr>';
    });
}

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
  abrirModal(pedidos[i]);
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

var modalFundo = document.getElementById('modalFundo');
var formPedido = document.getElementById('formPedido');
var modalErro = document.getElementById('modalErro');
var btnExcluir = document.getElementById('btnExcluir');
var editandoNumero = null;

function campo(id) {
  return document.getElementById(id);
}

function abrirModal(p) {
  modalErro.hidden = true;
  if (p) {
    editandoNumero = p.numero;
    campo('modalTitulo').innerHTML = 'Editar ' + p.id;
    btnExcluir.hidden = false;
  } else {
    editandoNumero = null;
    campo('modalTitulo').innerHTML = 'Novo pedido';
    btnExcluir.hidden = true;
    p = { cliente: '', itens: 1, peso: 1, prio: 'P3', status: 'Pendente', coletorOriginal: '', etaOriginal: '', prog: 0 };
  }
  campo('f-cliente').value = p.cliente;
  campo('f-itens').value = p.itens;
  campo('f-peso').value = p.peso;
  campo('f-prioridade').value = p.prio;
  campo('f-status').value = p.status;
  campo('f-coletor').value = p.coletorOriginal;
  campo('f-eta').value = p.etaOriginal;
  campo('f-progresso').value = p.prog;
  modalFundo.hidden = false;
  campo('f-cliente').focus();
}

function fecharModal() {
  modalFundo.hidden = true;
}

document.getElementById('btnNovo').addEventListener('click', function () {
  abrirModal(null);
});

campo('btnCancelar').addEventListener('click', fecharModal);

modalFundo.addEventListener('click', function (e) {
  if (e.target == modalFundo) {
    fecharModal();
  }
});

function tratarResposta(resposta) {
  return resposta.json().then(function (resultado) {
    if (!resposta.ok) {
      throw new Error(resultado.erro);
    }
    fecharModal();
    carregarPedidos();
  });
}

function mostrarErro(erro) {
  modalErro.textContent = erro.message;
  modalErro.hidden = false;
}

formPedido.addEventListener('submit', function (e) {
  e.preventDefault();

  var dados = {
    cliente: campo('f-cliente').value.trim(),
    itens: Number(campo('f-itens').value),
    pesoKg: Number(campo('f-peso').value),
    prioridade: campo('f-prioridade').value,
    status: campo('f-status').value,
    coletor: campo('f-coletor').value.trim(),
    eta: campo('f-eta').value,
    progresso: Number(campo('f-progresso').value)
  };

  var url = API + '/pedidos';
  var metodo = 'POST';
  if (editandoNumero != null) {
    url = API + '/pedidos/' + editandoNumero;
    metodo = 'PUT';
  }

  fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
    .then(tratarResposta)
    .catch(mostrarErro);
});

btnExcluir.addEventListener('click', function () {
  if (!confirm('Excluir o pedido ORD-' + editandoNumero + '?')) {
    return;
  }
  fetch(API + '/pedidos/' + editandoNumero, { method: 'DELETE' })
    .then(tratarResposta)
    .catch(mostrarErro);
});

carregarPedidos();
