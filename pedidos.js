var API = 'http://localhost:5000';

var pedidos = [];      // vem de /pedidos
var itensPedidos = []; // produtos de todos os pedidos, vem de /pedidos/itens
var catalogo = [];     // todos os produtos do armazém, vem de /catalogo
var selecionado = null; // número do pedido marcado na caixinha

var nomePrioridade = { P1: 'Urgente', P2: 'Normal', P3: 'Baixa' };

var classeStatus = {
  'Em Andamento': 's-andamento',
  'Iniciado': 's-iniciado',
  'Concluído': 's-concluido',
  'Pendente': 's-pendente'
};

function campo(id) {
  return document.getElementById(id);
}

function buscar(caminho) {
  return fetch(API + caminho).then(function (resposta) {
    return resposta.json();
  });
}

// Envia dados para a API e devolve a resposta, ou um erro com a mensagem da API
function enviar(metodo, caminho, dados) {
  return fetch(API + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  }).then(function (resposta) {
    return resposta.json().then(function (resultado) {
      if (!resposta.ok) {
        throw new Error(resultado.erro);
      }
      return resultado;
    });
  });
}

function acharPedido(numero) {
  for (var i = 0; i < pedidos.length; i++) {
    if (pedidos[i].id == numero) return pedidos[i];
  }
  return null;
}

function itensDoPedido(numero) {
  var lista = [];
  for (var i = 0; i < itensPedidos.length; i++) {
    if (itensPedidos[i].pedidoId == numero) lista.push(itensPedidos[i]);
  }
  return lista;
}

// Ordem da tabela: primeiro o que ainda falta fazer, do mais urgente para o menos
function ordemDosPedidos(a, b) {
  var aFeito = a.status == 'Concluído' ? 1 : 0;
  var bFeito = b.status == 'Concluído' ? 1 : 0;
  if (aFeito != bFeito) return aFeito - bFeito;
  if (a.prioridade != b.prioridade) return a.prioridade < b.prioridade ? -1 : 1;
  return a.id - b.id;
}

// Busca os pedidos e os produtos deles. Se receber uma função "depois", roda ela no final.
function carregarPedidos(depois) {
  Promise.all([buscar('/pedidos'), buscar('/pedidos/itens')])
    .then(function (dados) {
      pedidos = dados[0];
      pedidos.sort(ordemDosPedidos);
      itensPedidos = dados[1];
      if (acharPedido(selecionado) == null) selecionado = null;
      mostrarResumo();
      mostrarTabela();
      if (depois) depois();
    })
    .catch(function () {
      corpo.innerHTML = '<tr><td colspan="10">Não foi possível carregar os pedidos. A API está rodando?</td></tr>';
    });
}

// ---------- Tabela ----------

var filtroStatus = 'Todos';
var paginaAtual = 1;
var pedidosPorPagina = 5;

var corpo = campo('corpo');
var campoBusca = campo('busca');
var paginas = campo('paginas');

function chipPrioridade(prioridade) {
  return '<span class="chip p-' + prioridade + '">' + prioridade + ' · ' + nomePrioridade[prioridade] + '</span>';
}

function chipStatus(status) {
  return '<span class="chip ' + classeStatus[status] + '">' + status + '</span>';
}

function corDaBarra(p) {
  if (p.status == 'Concluído') return 'verde-bg';
  if (p.status == 'Iniciado') return 'azul-bg';
  return '';
}

function mostrarTabela() {
  var texto = campoBusca.value.toLowerCase();
  var filtrados = [];

  for (var i = 0; i < pedidos.length; i++) {
    var p = pedidos[i];
    if (filtroStatus != 'Todos' && p.status != filtroStatus) continue;
    var tudo = (p.codigo + ' ' + p.cliente).toLowerCase();
    if (tudo.indexOf(texto) == -1) continue;
    filtrados.push(p);
  }

  var totalPaginas = Math.ceil(filtrados.length / pedidosPorPagina);
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  if (paginaAtual < 1) paginaAtual = 1;

  var html = '';
  var inicio = (paginaAtual - 1) * pedidosPorPagina;
  for (var j = inicio; j < inicio + pedidosPorPagina && j < filtrados.length; j++) {
    var p = filtrados[j];
    var marcado = p.id == selecionado;

    html += '<tr class="linha' + (marcado ? ' marcada' : '') + '" onclick="abrirDetalhe(' + p.id + ')">';
    html += '<td class="marcar" onclick="event.stopPropagation()"><input type="checkbox"' + (marcado ? ' checked' : '') + ' onchange="marcarPedido(' + p.id + ', this.checked)"></td>';
    html += '<td class="mono cod">' + p.codigo + '</td>';
    html += '<td><b>' + p.cliente + '</b></td>';
    html += '<td>' + p.itens + '</td>';
    html += '<td class="mono">' + p.pesoKg + 'kg</td>';
    html += '<td>' + chipPrioridade(p.prioridade) + '</td>';
    html += '<td>' + (p.coletor || '—') + '</td>';
    html += '<td>' + chipStatus(p.status) + '</td>';
    html += '<td class="mono">' + (p.eta || '—') + '</td>';
    html += '<td><div class="prog"><div class="barra-fundo"><div class="barra-cheia ' + corDaBarra(p) + '" style="width:' + p.progresso + '%"></div></div>' + p.progresso + '%</div></td>';
    html += '</tr>';
  }
  if (html == '') {
    html = '<tr><td colspan="10">Nenhum pedido encontrado.</td></tr>';
  }

  corpo.innerHTML = html;
  campo('contagem').innerHTML = filtrados.length + ' de ' + pedidos.length + ' pedidos';

  var htmlPaginas = '';
  for (var k = 1; k <= totalPaginas; k++) {
    htmlPaginas += '<button' + (k == paginaAtual ? ' class="ativo"' : '') + ' data-pagina="' + k + '">' + k + '</button>';
  }
  paginas.innerHTML = htmlPaginas;

  // Editar e Excluir só funcionam com um pedido marcado
  campo('btnEditar').disabled = selecionado == null;
  campo('btnExcluir').disabled = selecionado == null;
}

// A caixinha marca um pedido por vez
function marcarPedido(numero, marcado) {
  selecionado = marcado ? numero : null;
  mostrarTabela();
}

function mostrarResumo() {
  var concluidos = 0;
  var andamento = 0;
  var pendentes = 0;

  for (var i = 0; i < pedidos.length; i++) {
    if (pedidos[i].status == 'Concluído') {
      concluidos++;
    } else if (pedidos[i].status == 'Pendente') {
      pendentes++;
    } else {
      andamento++;
    }
  }

  campo('r-total').innerHTML = pedidos.length;
  campo('r-concluidos').innerHTML = concluidos;
  campo('r-andamento').innerHTML = andamento;
  campo('r-pendentes').innerHTML = pendentes;
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

// ---------- Janelas ----------

function fecharJanelas() {
  campo('modalDetalhe').hidden = true;
  campo('modalEscolha').hidden = true;
  campo('modalDados').hidden = true;
  campo('modalProdutos').hidden = true;
}

// clicar fora de qualquer janela fecha
var fundos = document.querySelectorAll('.modal-fundo');
for (var f = 0; f < fundos.length; f++) {
  fundos[f].addEventListener('click', function (e) {
    if (e.target == this) fecharJanelas();
  });
}

// ---------- Detalhes do pedido ----------

function abrirDetalhe(numero) {
  var p = acharPedido(numero);
  var itens = itensDoPedido(numero);

  campo('detalheTitulo').innerHTML = p.codigo + ' · ' + p.cliente;
  campo('detalheDados').innerHTML =
    '<div class="detalhe-chips">' + chipPrioridade(p.prioridade) + chipStatus(p.status) +
    '<span>Coletor: <b>' + (p.coletor || 'ninguém ainda') + '</b></span>' +
    '<span>Previsto: <b>' + (p.eta || '—') + '</b></span>' +
    '<span>Itens: <b>' + p.itens + '</b></span>' +
    '<span>Peso: <b>' + p.pesoKg + ' kg</b></span>' +
    '<span>Progresso: <b>' + p.progresso + '%</b></span></div>' +
    '<div class="barra-fundo detalhe-barra"><div class="barra-cheia ' + corDaBarra(p) + '" style="width:' + p.progresso + '%"></div></div>';

  var html = '';
  for (var i = 0; i < itens.length; i++) {
    var item = itens[i];
    var situacao = '<span class="chip s-pendente">A coletar</span>';
    if (item.coletado) situacao = '<span class="chip s-concluido">Coletado</span>';

    html += '<tr><td class="mono amarelo">' + item.codigo + '</td>' +
      '<td>' + item.descricao + '</td>' +
      '<td>' + item.quantidade + '</td>' +
      '<td class="mono">' + (item.posicao || 'sem posição') + '</td>' +
      '<td>' + item.pesoKg + ' kg</td>' +
      '<td>' + situacao + '</td></tr>';
  }
  if (html == '') {
    html = '<tr><td colspan="6">Este pedido ainda não tem produtos. Marque a caixinha dele e use Editar.</td></tr>';
  }
  campo('detalheItens').innerHTML = html;
  campo('modalDetalhe').hidden = false;
}

// ---------- Editar: escolher entre dados e produtos ----------

campo('btnEditar').addEventListener('click', function () {
  campo('escolhaTitulo').innerHTML = 'Editar ' + acharPedido(selecionado).codigo;
  campo('modalEscolha').hidden = false;
});

// ---------- Dados do pedido (novo ou edição) ----------

var editandoNumero = null; // null quando é um pedido novo

function abrirDados(numero) {
  fecharJanelas();
  editandoNumero = numero;
  campo('dadosErro').hidden = true;

  if (numero == null) {
    campo('dadosTitulo').innerHTML = 'Novo pedido';
    campo('btnSalvarDados').innerHTML = 'Salvar e escolher produtos';
    campo('f-cliente').value = '';
    campo('f-prioridade').value = 'P2';
    campo('f-eta').value = '';
  } else {
    var p = acharPedido(numero);
    campo('dadosTitulo').innerHTML = 'Editar dados · ' + p.codigo;
    campo('btnSalvarDados').innerHTML = 'Salvar';
    campo('f-cliente').value = p.cliente;
    campo('f-prioridade').value = p.prioridade;
    campo('f-eta').value = p.eta || '';
  }

  campo('modalDados').hidden = false;
  campo('f-cliente').focus();
}

campo('btnNovo').addEventListener('click', function () {
  abrirDados(null);
});

campo('formDados').addEventListener('submit', function (e) {
  e.preventDefault();

  var dados = {
    cliente: campo('f-cliente').value.trim(),
    prioridade: campo('f-prioridade').value,
    eta: campo('f-eta').value
  };

  var envio;
  if (editandoNumero == null) {
    envio = enviar('POST', '/pedidos', dados); // entra sempre como Pendente
  } else {
    envio = enviar('PUT', '/pedidos/' + editandoNumero, dados);
  }

  envio
    .then(function (resultado) {
      var novo = editandoNumero == null ? resultado.id : null;
      fecharJanelas();
      carregarPedidos(function () {
        // pedido novo: já abre a janela para escolher os produtos
        if (novo != null) {
          selecionado = novo;
          mostrarTabela();
          abrirProdutos(novo);
        }
      });
    })
    .catch(function (erro) {
      campo('dadosErro').textContent = erro.message;
      campo('dadosErro').hidden = false;
    });
});

// ---------- Produtos do pedido ----------

var produtosEditando = []; // lista que está na janela: { caixaId, codigo, descricao, estoque, quantidade }
var produtosTravados = false; // true quando a coleta já começou
var paginaCatalogo = 1;
var produtosPorPagina = 5;

function abrirProdutos(numero) {
  fecharJanelas();
  var p = acharPedido(numero);
  campo('produtosTitulo').innerHTML = 'Produtos · ' + p.codigo + ' · ' + p.cliente;
  campo('produtosErro').hidden = true;

  // depois que a coleta começa, a lista de produtos não muda mais
  var travado = p.status != 'Pendente' && p.status != 'Iniciado';
  produtosTravados = travado;
  campo('btnSalvarProdutos').disabled = travado;
  if (travado) {
    campo('produtosErro').textContent = 'A coleta deste pedido já começou, então os produtos não podem mais ser alterados.';
    campo('produtosErro').hidden = false;
  }

  produtosEditando = [];
  var itens = itensDoPedido(numero);
  for (var i = 0; i < itens.length; i++) {
    produtosEditando.push({
      caixaId: itens[i].caixaId,
      codigo: itens[i].codigo,
      descricao: itens[i].descricao,
      estoque: estoqueDe(itens[i].caixaId),
      quantidade: itens[i].quantidade
    });
  }

  campo('p-busca').value = '';
  paginaCatalogo = 1;

  mostrarProdutos();
  mostrarCatalogo();
  campo('modalProdutos').hidden = false;
}

function estoqueDe(caixaId) {
  for (var i = 0; i < catalogo.length; i++) {
    if (catalogo[i].id == caixaId) return catalogo[i].quantidade;
  }
  return 0;
}

function mostrarProdutos() {
  var html = '';
  for (var i = 0; i < produtosEditando.length; i++) {
    var pr = produtosEditando[i];
    html += '<tr><td class="mono amarelo">' + pr.codigo + '</td>' +
      '<td>' + pr.descricao + '</td>' +
      '<td>' + pr.estoque + '</td>' +
      '<td><input type="number" min="1" value="' + pr.quantidade + '" onchange="mudarQuantidade(' + i + ', this.value)"></td>' +
      '<td><button type="button" class="btn-remover" onclick="removerProduto(' + i + ')">Remover</button></td></tr>';
  }
  if (html == '') {
    html = '<tr><td colspan="5">Nenhum produto ainda. Escolha na tabela abaixo e clique em Adicionar.</td></tr>';
  }
  campo('produtosLista').innerHTML = html;
}

function mudarQuantidade(indice, valor) {
  produtosEditando[indice].quantidade = Number(valor);
}

function removerProduto(indice) {
  produtosEditando.splice(indice, 1);
  mostrarProdutos();
  mostrarCatalogo();
}

function estaNoPedido(caixaId) {
  for (var i = 0; i < produtosEditando.length; i++) {
    if (produtosEditando[i].caixaId == caixaId) return true;
  }
  return false;
}

// Tabela com todos os produtos do armazém, 5 por página, para escolher o que entra no pedido
function mostrarCatalogo() {
  var texto = campo('p-busca').value.toLowerCase();
  var filtrados = [];
  for (var i = 0; i < catalogo.length; i++) {
    var c = catalogo[i];
    var tudo = (c.codigo + ' ' + c.descricao + ' ' + c.categoria).toLowerCase();
    if (tudo.indexOf(texto) != -1) filtrados.push(c);
  }

  var totalPaginas = Math.ceil(filtrados.length / produtosPorPagina);
  if (totalPaginas < 1) totalPaginas = 1;
  if (paginaCatalogo > totalPaginas) paginaCatalogo = totalPaginas;
  if (paginaCatalogo < 1) paginaCatalogo = 1;

  var html = '';
  var inicio = (paginaCatalogo - 1) * produtosPorPagina;
  for (var j = inicio; j < inicio + produtosPorPagina && j < filtrados.length; j++) {
    var c = filtrados[j];
    var botao = '<button type="button" class="btn-adicionar" onclick="adicionarProduto(' + c.id + ')"' + (produtosTravados ? ' disabled' : '') + '>Adicionar</button>';
    if (estaNoPedido(c.id)) botao = '<span class="chip s-concluido">No pedido</span>';

    html += '<tr><td class="mono amarelo">' + c.codigo + '</td>' +
      '<td>' + c.descricao + '</td>' +
      '<td>' + c.categoria + '</td>' +
      '<td>' + c.quantidade + '</td>' +
      '<td>' + botao + '</td></tr>';
  }
  if (html == '') {
    html = '<tr><td colspan="5">Nenhum produto encontrado.</td></tr>';
  }

  campo('catalogoLista').innerHTML = html;
  campo('catPagina').innerHTML = 'Página ' + paginaCatalogo + ' de ' + totalPaginas + ' · ' + filtrados.length + ' produtos';
  campo('btnCatAnterior').disabled = paginaCatalogo == 1;
  campo('btnCatProxima').disabled = paginaCatalogo == totalPaginas;
}

function mudarPaginaCatalogo(passo) {
  paginaCatalogo += passo;
  mostrarCatalogo();
}

campo('p-busca').addEventListener('input', function () {
  paginaCatalogo = 1;
  mostrarCatalogo();
});

// Entra no pedido com quantidade 1. A quantidade é ajustada na lista de cima.
function adicionarProduto(caixaId) {
  for (var c = 0; c < catalogo.length; c++) {
    if (catalogo[c].id == caixaId) {
      produtosEditando.push({
        caixaId: caixaId,
        codigo: catalogo[c].codigo,
        descricao: catalogo[c].descricao,
        estoque: catalogo[c].quantidade,
        quantidade: 1
      });
    }
  }
  mostrarProdutos();
  mostrarCatalogo();
}

campo('btnSalvarProdutos').addEventListener('click', function () {
  var lista = [];
  for (var i = 0; i < produtosEditando.length; i++) {
    lista.push({ caixaId: produtosEditando[i].caixaId, quantidade: produtosEditando[i].quantidade });
  }

  enviar('PUT', '/pedidos/' + selecionado + '/itens', lista)
    .then(function () {
      fecharJanelas();
      carregarPedidos();
    })
    .catch(function (erro) {
      campo('produtosErro').textContent = erro.message;
      campo('produtosErro').hidden = false;
    });
});

// ---------- Excluir ----------

campo('btnExcluir').addEventListener('click', function () {
  var p = acharPedido(selecionado);
  if (!confirm('Excluir o pedido ' + p.codigo + ' de ' + p.cliente + '?')) {
    return;
  }
  fetch(API + '/pedidos/' + selecionado, { method: 'DELETE' })
    .then(function () {
      selecionado = null;
      carregarPedidos();
    });
});

// ---------- Início ----------

buscar('/catalogo').then(function (dados) {
  catalogo = dados;
});
carregarPedidos();
