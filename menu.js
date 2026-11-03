if (sessionStorage.getItem('logado') != 'sim') {
  window.location.href = 'index.html';
}

var telas = [
  { arquivo: 'overview.html', icone: '▦', nome: 'Overview' },
  { arquivo: 'mapa.html', icone: '🗺', nome: 'Mapa do Armazém' },
  { arquivo: 'pedidos.html', icone: '📋', nome: 'Pedidos' },
  { arquivo: 'catalogo.html', icone: '📦', nome: 'Catálogo SKU' }
];

var arquivoAtual = window.location.pathname.split('/').pop();

var menu = '<div class="logo"><h1>📚 <span>Smart</span>Pick</h1><small>by Telecontrol</small></div>';
menu = menu + '<p class="menu-titulo">TORRE DE CONTROLE</p><nav>';

for (var i = 0; i < telas.length; i++) {
  var classe = '';
  var bolinha = '';
  if (telas[i].arquivo == arquivoAtual) {
    classe = ' class="ativo"';
    bolinha = ' <b>●</b>';
  }
  menu = menu + '<a href="' + telas[i].arquivo + '"' + classe + '>' + telas[i].icone + ' ' + telas[i].nome + bolinha + '</a>';
}

menu = menu + '</nav>';
var nome = sessionStorage.getItem('nome') || 'Usuário';
var cargo = 'Gestor · Torre de Controle';
if (sessionStorage.getItem('perfil') == 'operador') {
  cargo = 'Operador · ' + (sessionStorage.getItem('turno') || 'Coleta');
}
menu = menu + '<div class="usuario"><div class="avatar">' + nome[0] + '</div><div><strong>' + nome + '</strong><small>' + cargo + '</small></div></div>';
menu = menu + '<p class="coletores" id="coletoresAtivos">● coletores ativos agora</p>';
menu = menu + '<a href="index.html" class="sair" onclick="sessionStorage.clear()">⏻ Sair</a>';

document.getElementById('menu').innerHTML = menu;
document.getElementById('data').innerHTML = new Date().toLocaleString('pt-BR');

fetch('http://localhost:5000/overview')
  .then(function (resposta) {
    return resposta.json();
  })
  .then(function (dados) {
    document.getElementById('coletoresAtivos').innerHTML = '● ' + dados.coletoresAtivos + ' coletores ativos agora';
  })
  .catch(function () {});
