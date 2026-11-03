if (sessionStorage.getItem('logado') != 'sim') {
  window.location.href = 'index.html';
}

var API = 'http://localhost:5000';

var produtos = [];

function converterItem(item) {
  var alto = item.nivel == 3 || item.restrita;
  return {
    id: item.id,
    codigo: item.codigo,
    nome: item.descricao,
    cat: item.categoria,
    qtd: item.quantidade,
    min: item.minimo,
    nivel: alto ? 'HIGH' : 'GROUND',
    comp: item.profundidadeCm,
    larg: item.larguraCm,
    alt: item.alturaCm,
    peso: item.pesoKg,
    zona: item.corredor || '—',
    corredor: item.corredor || '—',
    posicao: item.posicao ? item.posicao.substring(item.posicao.indexOf('-') + 1) : '—',
    prat: item.prateleira || '—',
    endereco: item.posicao || 'Sem posição',
    ean: item.ean
  };
}

var selecionado = 0;

var campoBusca = document.getElementById('busca');
var divItens = document.getElementById('itens');
var contador = document.getElementById('contador');
var btnEditar = document.getElementById('btnEditar');
var btnExcluir = document.getElementById('btnExcluir');
var btnNovo = document.getElementById('btnNovo');

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
  document.getElementById('d-endereco').innerHTML = p.endereco;
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

var modalFundo = document.getElementById('modalFundo');
var formProduto = document.getElementById('formProduto');
var modalErro = document.getElementById('modalErro');
var editandoId = null;

function campo(id) {
  return document.getElementById(id);
}

function abrirModal(p) {
  modalErro.hidden = true;
  if (p) {
    editandoId = p.id;
    campo('modalTitulo').innerHTML = 'Editar ' + p.codigo;
  } else {
    editandoId = null;
    campo('modalTitulo').innerHTML = 'Novo produto';
    p = { codigo: '', nome: '', cat: '', qtd: 1, min: 0, peso: '', ean: '', comp: '', larg: '', alt: '' };
  }
  campo('f-codigo').value = p.codigo;
  campo('f-descricao').value = p.nome;
  campo('f-categoria').value = p.cat;
  campo('f-quantidade').value = p.qtd;
  campo('f-minimo').value = p.min;
  campo('f-peso').value = p.peso;
  campo('f-ean').value = p.ean;
  campo('f-comp').value = p.comp;
  campo('f-larg').value = p.larg;
  campo('f-alt').value = p.alt;
  modalFundo.hidden = false;
  campo('f-descricao').focus();
}

function fecharModal() {
  modalFundo.hidden = true;
}

btnEditar.addEventListener('click', function () {
  if (produtos.length > 0) {
    abrirModal(produtos[selecionado]);
  }
});

btnNovo.addEventListener('click', function () {
  abrirModal(null);
});

campo('btnCancelar').addEventListener('click', fecharModal);

modalFundo.addEventListener('click', function (e) {
  if (e.target == modalFundo) {
    fecharModal();
  }
});

formProduto.addEventListener('submit', function (e) {
  e.preventDefault();

  var dados = {
    codigo: campo('f-codigo').value.trim(),
    descricao: campo('f-descricao').value.trim(),
    categoria: campo('f-categoria').value.trim(),
    quantidade: Number(campo('f-quantidade').value),
    minimo: Number(campo('f-minimo').value),
    pesoKg: Number(campo('f-peso').value),
    ean: campo('f-ean').value.trim(),
    profundidadeCm: Number(campo('f-comp').value),
    larguraCm: Number(campo('f-larg').value),
    alturaCm: Number(campo('f-alt').value)
  };

  var url = API + '/caixas';
  var metodo = 'POST';
  if (editandoId != null) {
    url = API + '/caixas/' + editandoId;
    metodo = 'PUT';
  }

  fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
    .then(function (resposta) {
      return resposta.json().then(function (resultado) {
        if (!resposta.ok) {
          throw new Error(resultado.erro);
        }
        var idParaMostrar = editandoId != null ? editandoId : resultado.id;
        fecharModal();
        carregarCatalogo(idParaMostrar);
      });
    })
    .catch(function (erro) {
      modalErro.textContent = erro.message;
      modalErro.hidden = false;
    });
});

btnExcluir.addEventListener('click', function () {
  if (produtos.length == 0) {
    return;
  }
  var p = produtos[selecionado];
  if (!confirm('Excluir o produto ' + p.codigo + ' - ' + p.nome + '?')) {
    return;
  }

  fetch(API + '/caixas/' + p.id, { method: 'DELETE' })
    .then(function (resposta) {
      return resposta.json().then(function (resultado) {
        if (!resposta.ok) {
          throw new Error(resultado.erro);
        }
        carregarCatalogo(null);
      });
    })
    .catch(function (erro) {
      alert('Não foi possível excluir: ' + erro.message);
    });
});

var agora = new Date();
document.getElementById('data').innerHTML = agora.toLocaleString('pt-BR');

function carregarCatalogo(idParaMostrar) {
  fetch(API + '/catalogo')
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (itens) {
      produtos = [];
      selecionado = 0;
      for (var i = 0; i < itens.length; i++) {
        produtos.push(converterItem(itens[i]));
        if (itens[i].id == idParaMostrar) {
          selecionado = i;
        }
      }
      mostrarLista(campoBusca.value);
      if (produtos.length > 0) {
        mostrarDetalhe(produtos[selecionado]);
      }
    })
    .catch(function () {
      divItens.innerHTML = '<p class="item-nome">Não foi possível carregar o catálogo. A API está rodando?</p>';
    });
}

carregarCatalogo(null);
