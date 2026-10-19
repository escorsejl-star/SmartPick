if (sessionStorage.getItem('logado') != 'sim') {
  window.location.href = 'index.html';
}

var produtos = [
  { codigo: 'TN-5501', nome: 'Tênis Nike Air Max 270', cat: 'Calçados', qtd: 48, min: 10, nivel: 'GROUND',
    comp: 35, larg: 22, alt: 15, peso: 1.8, zona: 'A', corredor: 'A', posicao: '03', prat: 'P1', ean: '7891000055012' },
  { codigo: 'TV-8801', nome: 'Smart TV Samsung 55" QLED', cat: 'Eletrônicos', qtd: 6, min: 3, nivel: 'HIGH',
    comp: 123, larg: 15, alt: 71, peso: 17.5, zona: 'C', corredor: 'C', posicao: '01', prat: 'P4', ean: '7891000088014' },
  { codigo: 'NB-3201', nome: 'Notebook Dell Inspiron 15', cat: 'Eletrônicos', qtd: 12, min: 5, nivel: 'GROUND',
    comp: 38, larg: 26, alt: 4, peso: 1.9, zona: 'B', corredor: 'B', posicao: '07', prat: 'P2', ean: '7891000032013' },
  { codigo: 'CA-7710', nome: 'Câmera Canon EOS R50', cat: 'Eletrônicos', qtd: 3, min: 5, nivel: 'GROUND',
    comp: 12, larg: 9, alt: 8, peso: 0.7, zona: 'B', corredor: 'B', posicao: '09', prat: 'P1', ean: '7891000077106' },
  { codigo: 'CH-1142', nome: 'Chuveiro Lorenzetti Advanced', cat: 'Elétricos', qtd: 22, min: 8, nivel: 'GROUND',
    comp: 20, larg: 20, alt: 12, peso: 0.9, zona: 'D', corredor: 'D', posicao: '02', prat: 'P2', ean: '7891000011425' },
  { codigo: 'SD-5501', nome: 'Sofá 3 Lugares Revestido', cat: 'Móveis', qtd: 4, min: 2, nivel: 'HIGH',
    comp: 210, larg: 90, alt: 85, peso: 42, zona: 'E', corredor: 'E', posicao: '01', prat: 'P5', ean: '7891000055019' },
  { codigo: 'AQ-2250', nome: 'Ar Cond. Midea 12000 BTU', cat: 'Eletrônicos', qtd: 8, min: 4, nivel: 'HIGH',
    comp: 80, larg: 30, alt: 28, peso: 11, zona: 'C', corredor: 'C', posicao: '05', prat: 'P4', ean: '7891000022504' },
  { codigo: 'BL-0011', nome: 'Blusa Polo Lacoste P', cat: 'Vestuário', qtd: 65, min: 20, nivel: 'GROUND',
    comp: 30, larg: 25, alt: 3, peso: 0.3, zona: 'A', corredor: 'A', posicao: '12', prat: 'P1', ean: '7891000000115' }
];

var selecionado = 0;
var editando = false;

var campoBusca = document.getElementById('busca');
var divItens = document.getElementById('itens');
var contador = document.getElementById('contador');
var btnEditar = document.getElementById('btnEditar');
var btnSalvar = document.getElementById('btnSalvar');
var titulo = document.getElementById('d-nome');


function mostrarLista(texto) {
  var html = '';
  var total = 0;

  for (var i = 0; i < produtos.length; i++) {
    var p = produtos[i];

    var tudo = p.codigo + ' ' + p.nome;
    tudo = tudo.toLowerCase();
    if (tudo.indexOf(texto.toLowerCase()) == -1) {
      continue;
    }

    total = total + 1;

    var classe = 'item';
    if (i == selecionado) {
      classe = 'item ativo';
    }

    var selos = '<span class="selo selo-' + p.nivel + '">' + p.nivel + '</span>';
    if (p.qtd <= p.min) {
      selos = selos + '<span class="selo selo-BAIXO">BAIXO</span>';
    }

    html = html + '<div class="' + classe + '" onclick="escolher(' + i + ')">';
    html = html + '<div class="item-linha">';
    html = html + '<span class="item-cod">' + p.codigo + '</span>';
    html = html + '<span>' + selos + '</span>';
    html = html + '</div>';
    html = html + '<p class="item-nome">' + p.nome + '</p>';
    html = html + '<p class="item-cat">' + p.cat + ' · ' + p.qtd + ' un.</p>';
    html = html + '</div>';
  }

  divItens.innerHTML = html;
  contador.innerHTML = total;
}

function escolher(numero) {
  selecionado = numero;
  console.log('produto escolhido: ' + produtos[numero].codigo);

  mostrarLista(campoBusca.value);
  mostrarDetalhe(produtos[numero]);
}

function desenharBarras(ean) {
  var html = '';

  for (var i = 0; i < ean.length; i++) {
    var n = Number(ean[i]);
    var largura1 = 1 + (n % 3);
    var largura2 = 1 + ((n + 1) % 2);

    html = html + '<i style="width:' + largura1 + 'px;margin-right:1px"></i>';
    html = html + '<i style="width:' + largura2 + 'px;margin-right:2px"></i>';
  }

  document.getElementById('d-barras').innerHTML = html;
}

function mostrarDetalhe(p) {
  document.getElementById('d-codigo').innerHTML = p.codigo;
  document.getElementById('d-nome').innerHTML = p.nome;
  document.getElementById('d-categoria').innerHTML = p.cat;

  var acesso = '';
  if (p.nivel == 'GROUND') {
    acesso = 'Acesso manual';
  } else {
    acesso = 'Requer empilhadeira';
  }
  var nivel = document.getElementById('d-nivel');
  nivel.className = 'nivel nivel-' + p.nivel;
  nivel.innerHTML = 'Nível do Solo — ' + p.nivel + '<small>' + acesso + '</small>';

  document.getElementById('d-comp').innerHTML = p.comp + 'cm';
  document.getElementById('d-larg').innerHTML = p.larg + 'cm';
  document.getElementById('d-alt').innerHTML = p.alt + 'cm';
  document.getElementById('d-peso').innerHTML = p.peso + 'kg';

  document.getElementById('d-zona').innerHTML = 'Zona ' + p.zona;
  document.getElementById('d-endereco').innerHTML = p.corredor + '-' + p.posicao + '-' + p.prat;
  document.getElementById('d-etiquetas').innerHTML =
    '<span>Corredor: <b>' + p.corredor + '</b></span>' +
    '<span>Posição: <b>' + p.posicao + '</b></span>' +
    '<span>Prateleira: <b>' + p.prat + '</b></span>';

  desenharBarras(p.ean);
  document.getElementById('d-ean').innerHTML = p.ean;

  var qtd = document.getElementById('d-qtd');
  var barra = document.getElementById('d-barra');

  qtd.innerHTML = p.qtd;
  document.getElementById('d-min').innerHTML = p.min;

  var porcento = (p.qtd / (p.min * 2)) * 100;
  if (porcento > 100) {
    porcento = 100;
  }
  barra.style.width = porcento + '%';

  if (p.qtd <= p.min) {
    qtd.className = 'qtd baixo';
    barra.className = 'barra-cheia baixo';
  } else {
    qtd.className = 'qtd';
    barra.className = 'barra-cheia';
  }
}

campoBusca.addEventListener('input', function () {
  mostrarLista(campoBusca.value);
});

btnEditar.addEventListener('click', function () {
  if (editando == false) {
    editando = true;
    titulo.contentEditable = true;
    titulo.focus();
    btnEditar.innerHTML = 'Cancelar';
  } else {
    editando = false;
    titulo.contentEditable = false;
    btnEditar.innerHTML = 'Editar';
    mostrarDetalhe(produtos[selecionado]);
  }
});

btnSalvar.addEventListener('click', function () {
  produtos[selecionado].nome = titulo.innerHTML;

  titulo.contentEditable = false;
  btnEditar.innerHTML = 'Editar';
  editando = false;

  mostrarLista(campoBusca.value);
  alert('Salvo!');

});

var agora = new Date();
document.getElementById('data').innerHTML = agora.toLocaleString('pt-BR');

mostrarLista('');
mostrarDetalhe(produtos[0]);
