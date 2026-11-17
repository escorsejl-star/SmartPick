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

var pedidos = [];
var meu = null;

function ordemPrioridade(a, b) {
  if (a.prioridade < b.prioridade) return -1;
  if (a.prioridade > b.prioridade) return 1;
  return a.id - b.id;
}

function itensColetados(p) {
  return Math.round(p.progresso * p.itens / 100);
}

function mostrarMeuPedido() {
  var div = document.getElementById('meuPedido');
  if (meu == null) {
    div.innerHTML = '<p class="sub">Você não está com nenhum pedido. Pegue um pedido da lista abaixo.</p>';
    return;
  }

  var coletados = itensColetados(meu);
  var html = '<div class="coletor-linha"><span class="mono amarelo">' + meu.codigo + ' · ' + meu.prioridade + '</span><span class="sub">' + meu.status + '</span></div>';
  html = html + '<p class="pedido-grande">' + meu.cliente + '</p>';
  html = html + '<div class="coletor-linha"><span>' + coletados + ' de ' + meu.itens + ' itens coletados</span><strong class="amarelo">' + meu.progresso + '%</strong></div>';
  html = html + '<div class="barra-fundo"><div class="barra-cheia" style="width:' + meu.progresso + '%"></div></div>';
  html = html + '<div class="portal-botoes">';
  html = html + '<button class="btn-azul" onclick="coletarItem()"' + (coletados >= meu.itens ? ' disabled' : '') + '>Coletei 1 item</button>';
  html = html + '<button class="btn-amarelo" onclick="concluir()"' + (coletados < meu.itens ? ' disabled' : '') + '>Concluir pedido</button>';
  html = html + '</div>';
  div.innerHTML = html;
}

function mostrarPendentes() {
  var lista = [];
  for (var i = 0; i < pedidos.length; i++) {
    if (pedidos[i].status == 'Pendente') lista.push(pedidos[i]);
  }
  lista.sort(ordemPrioridade);

  var html = '';
  for (var j = 0; j < lista.length; j++) {
    var p = lista[j];
    html = html + '<div class="pedido-linha"><div>' +
      '<strong>' + p.codigo + ' · ' + p.cliente + '</strong>' +
      '<small>' + p.prioridade + ' · ' + p.itens + ' itens · ' + p.pesoKg + ' kg' + (p.eta ? ' · até ' + p.eta : '') + '</small>' +
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

function carregarPedidos() {
  fetch(API + '/pedidos')
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (dados) {
      pedidos = dados;
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

// Salva o pedido com os novos valores e recarrega a tela
function salvar(p, mudancas) {
  var dados = {
    cliente: p.cliente,
    itens: p.itens,
    pesoKg: p.pesoKg,
    prioridade: p.prioridade,
    coletor: p.coletor,
    status: p.status,
    eta: p.eta,
    progresso: p.progresso
  };
  for (var campo in mudancas) {
    dados[campo] = mudancas[campo];
  }

  fetch(API + '/pedidos/' + p.id, {
    method: 'PUT',
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

function pegarPedido(id) {
  for (var i = 0; i < pedidos.length; i++) {
    if (pedidos[i].id == id) {
      salvar(pedidos[i], { coletor: meuNome, status: 'Iniciado', progresso: 0 });
    }
  }
}

function coletarItem() {
  var coletados = itensColetados(meu) + 1;
  var progresso = Math.round(coletados * 100 / meu.itens);
  salvar(meu, { status: 'Em Andamento', progresso: progresso });
}

function concluir() {
  salvar(meu, { status: 'Concluído', progresso: 100 });
}

carregarPedidos();
