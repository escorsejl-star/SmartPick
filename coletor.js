if (sessionStorage.getItem('logado') != 'sim') {
  window.location.href = 'index.html';
}

var API = 'http://localhost:5000';

// "Carlos Mendes" vira "Carlos M.", que é o formato usado na coluna coletor dos pedidos
function nomeCurto(nome) {
  var partes = nome.trim().split(' ');
  if (partes.length == 1) return partes[0];
  return partes[0] + ' ' + partes[partes.length - 1][0] + '.';
}

var meuNome = nomeCurto(sessionStorage.getItem('nome') || 'Coletor');
var turno = sessionStorage.getItem('turno');
document.getElementById('nomeColetor').innerHTML = meuNome + (turno ? ' · ' + turno : '');

var nomePrioridade = { P1: 'Urgente', P2: 'Normal', P3: 'Baixa' };

var pedidos = [];
var itensPedidos = []; // produtos de todos os pedidos
var meu = null;        // o pedido que estou coletando

function ordemPrioridade(a, b) {
  if (a.prioridade < b.prioridade) return -1;
  if (a.prioridade > b.prioridade) return 1;
  return a.id - b.id;
}

function chipPrioridade(prioridade) {
  return '<span class="chip p-' + prioridade + '">' + prioridade + ' · ' + nomePrioridade[prioridade] + '</span>';
}

function mostrarMeuPedido() {
  var div = document.getElementById('meuPedido');
  if (meu == null) {
    div.innerHTML = '<p class="sub">Você não está com nenhum pedido. Pegue um pedido da lista abaixo.</p>';
    return;
  }

  var html = '<div class="coletor-linha"><span class="mono amarelo">' + meu.codigo + '</span>' + chipPrioridade(meu.prioridade) + '</div>';
  html += '<p class="pedido-grande">' + meu.cliente + '</p>';
  html += '<div class="coletor-linha"><span>' + meu.status + (meu.eta ? ' · até ' + meu.eta : '') + '</span><strong class="amarelo">' + meu.progresso + '%</strong></div>';
  html += '<div class="barra-fundo"><div class="barra-cheia" style="width:' + meu.progresso + '%"></div></div>';

  // um produto por linha, cada um com o seu botão de coletar
  html += '<div class="produtos-coleta">';
  for (var i = 0; i < itensPedidos.length; i++) {
    var item = itensPedidos[i];
    if (item.pedidoId != meu.id) continue;

    html += '<div class="pedido-linha' + (item.coletado ? ' coletada' : '') + '"><div>' +
      '<strong>' + item.quantidade + 'x ' + item.descricao + '</strong>' +
      '<small>' + item.codigo + ' · ' + (item.posicao || 'sem posição') + ' · ' + item.pesoKg + ' kg</small></div>';
    if (item.coletado) {
      html += '<span class="chip s-concluido">Coletado</span>';
    } else {
      html += '<button class="btn-amarelo" onclick="coletarProduto(' + item.id + ')">Coletar</button>';
    }
    html += '</div>';
  }
  html += '</div>';

  div.innerHTML = html;
}

function mostrarPendentes() {
  var lista = [];
  for (var i = 0; i < pedidos.length; i++) {
    // pedido sem produto ainda está sendo montado pelo gestor
    if (pedidos[i].status == 'Pendente' && pedidos[i].itens > 0) lista.push(pedidos[i]);
  }
  lista.sort(ordemPrioridade);

  var html = '';
  for (var j = 0; j < lista.length; j++) {
    var p = lista[j];
    html += '<div class="pedido-linha"><div>' +
      '<strong>' + p.codigo + ' · ' + p.cliente + '</strong>' +
      '<small>' + p.prioridade + ' · ' + nomePrioridade[p.prioridade] + ' · ' + p.itens + ' itens · ' + p.pesoKg + ' kg' + (p.eta ? ' · até ' + p.eta : '') + '</small>' +
      '</div><button class="btn-amarelo" onclick="pegarPedido(' + p.id + ')"' + (meu != null ? ' disabled' : '') + '>Pegar</button></div>';
  }
  if (lista.length == 0) {
    html = '<p class="sub">Nenhum pedido pendente.</p>';
  }
  document.getElementById('pendentes').innerHTML = html;
}

function mostrarErro(texto) {
  var erro = document.getElementById('erro');
  erro.textContent = texto;
  erro.hidden = false;
}

function buscar(caminho) {
  return fetch(API + caminho).then(function (resposta) {
    return resposta.json();
  });
}

function carregarPedidos() {
  Promise.all([buscar('/pedidos'), buscar('/pedidos/itens')])
    .then(function (dados) {
      pedidos = dados[0];
      itensPedidos = dados[1];
      meu = null;
      for (var i = 0; i < pedidos.length; i++) {
        var p = pedidos[i];
        if (p.coletor == meuNome && (p.status == 'Iniciado' || p.status == 'Em Andamento')) {
          meu = p;
        }
      }
      document.getElementById('erro').hidden = true;
      mostrarMeuPedido();
      mostrarPendentes();
    })
    .catch(function () {
      mostrarErro('Não foi possível carregar os pedidos. A API está rodando?');
    });
}

// Manda uma ação para a API e recarrega a tela. Quem muda o status é a API.
function enviar(caminho, dados) {
  fetch(API + caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
    .then(function (resposta) {
      return resposta.json().then(function (resultado) {
        if (!resposta.ok) {
          throw new Error(resultado.erro);
        }
        carregarPedidos();
      });
    })
    .catch(function (erro) {
      mostrarErro(erro.message);
    });
}

// Pendente -> Iniciado
function pegarPedido(id) {
  enviar('/pedidos/' + id + '/pegar', { coletor: meuNome });
}

// Primeiro produto coletado -> Em Andamento. Último -> Concluído.
function coletarProduto(itemId) {
  enviar('/pedidos/' + meu.id + '/itens/' + itemId + '/coletar', {});
}

carregarPedidos();
