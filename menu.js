if (sessionStorage.getItem('logado') != 'sim') {
  window.location.href = 'index.html';
}

function icone(desenho) {
  return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + desenho + '</svg>';
}

var telas = [
  { arquivo: 'overview.html', icone: icone('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'), nome: 'Overview' },
  { arquivo: 'mapa.html', icone: icone('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'), nome: 'Mapa do Armazém' },
  { arquivo: 'pedidos.html', icone: icone('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>'), nome: 'Pedidos' },
  { arquivo: 'catalogo.html', icone: icone('<path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>'), nome: 'Catálogo SKU' }
];
var iconeSair = icone('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h9"/>');

var arquivoAtual = window.location.pathname.split('/').pop();

var menu = '<div class="logo"><h1><span>Smart</span>Pick</h1><small>by Telecontrol</small></div>';
menu = menu + '<p class="menu-titulo">TORRE DE CONTROLE</p><nav>';

for (var i = 0; i < telas.length; i++) {
  var classe = '';
  if (telas[i].arquivo == arquivoAtual) {
    classe = ' class="ativo"';
  }
  menu = menu + '<a href="' + telas[i].arquivo + '"' + classe + '>' + telas[i].icone + telas[i].nome + '</a>';
}

menu = menu + '</nav>';
var nome = sessionStorage.getItem('nome') || 'Usuário';
var cargo = 'Gestor · Torre de Controle';
if (sessionStorage.getItem('perfil') == 'operador') {
  cargo = 'Operador · ' + (sessionStorage.getItem('turno') || 'Coleta');
}
menu = menu + '<div class="usuario"><div class="avatar">' + nome[0] + '</div><div><strong>' + nome + '</strong><small>' + cargo + '</small></div></div>';
menu = menu + '<p class="coletores" id="coletoresAtivos">coletores ativos agora</p>';
menu = menu + '<a href="index.html" class="sair" onclick="sessionStorage.clear()">' + iconeSair + 'Sair</a>';

document.getElementById('menu').innerHTML = menu;
document.getElementById('data').innerHTML = new Date().toLocaleString('pt-BR');

fetch('http://localhost:5000/overview')
  .then(function (resposta) {
    return resposta.json();
  })
  .then(function (dados) {
    document.getElementById('coletoresAtivos').innerHTML = dados.coletoresAtivos + ' coletores ativos agora';
  })
  .catch(function () {});
