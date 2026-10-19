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
menu = menu + '<div class="usuario"><div class="avatar">G</div><div><strong>Gustavo Lima</strong><small>Gestor · Torre de Controle</small></div></div>';
menu = menu + '<p class="coletores">● 7 coletores ativos agora</p>';
menu = menu + '<a href="index.html" class="sair" onclick="sessionStorage.clear()">⏻ Sair</a>';

document.getElementById('menu').innerHTML = menu;
document.getElementById('data').innerHTML = new Date().toLocaleString('pt-BR');
