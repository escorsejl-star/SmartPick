if (sessionStorage.getItem('logado') != 'sim') {
  window.location.href = 'index.html';
}

var API = 'http://localhost:5000';

var produtos = [];  // vem de /catalogo
var posicoes = [];  // todas as posições do armazém, vem de /mapa

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
    endereco: item.posicao || 'Sem prateleira',
    temPosicao: item.posicao != null,
    ean: item.ean
  };
}

function campo(id) {
  return document.getElementById(id);
}

var selecionado = 0;       // índice do produto aberto no detalhe
var filtro = 'TODAS';      // 'TODAS', 'SEM' ou o nome de uma prateleira (P1, P2...)
var paginaAtual = 1;
var produtosPorPagina = 6;

var campoBusca = campo('busca');
var divItens = campo('itens');
var btnEditar = campo('btnEditar');
var btnExcluir = campo('btnExcluir');
var btnNovo = campo('btnNovo');
var btnPrateleira = campo('btnPrateleira');

// ---------- Lista ----------

// Nomes das prateleiras, tirados das posições do armazém
function nomesDasPrateleiras() {
  var nomes = [];
  for (var i = 0; i < posicoes.length; i++) {
    if (nomes.indexOf(posicoes[i].prateleira) == -1) {
      nomes.push(posicoes[i].prateleira);
    }
  }
  return nomes;
}

// Devolve os índices dos produtos que passam na busca e no filtro de prateleira
function filtrar() {
  var texto = campoBusca.value.toLowerCase();
  var lista = [];

  for (var i = 0; i < produtos.length; i++) {
    var p = produtos[i];

    var tudo = (p.codigo + ' ' + p.nome + ' ' + p.cat).toLowerCase();
    if (tudo.indexOf(texto) == -1) continue;

    if (filtro == 'SEM' && p.temPosicao) continue;
    if (filtro != 'TODAS' && filtro != 'SEM' && p.prat != filtro) continue;

    lista.push(i);
  }
  return lista;
}

function mostrarFiltros() {
  var semPrateleira = 0;
  for (var i = 0; i < produtos.length; i++) {
    if (!produtos[i].temPosicao) semPrateleira++;
  }

  var nomes = nomesDasPrateleiras();
  var html = '<button class="' + (filtro == 'TODAS' ? 'ativo' : '') + '" onclick="mudarFiltro(\'TODAS\')">Todas</button>';
  for (var j = 0; j < nomes.length; j++) {
    html += '<button class="' + (filtro == nomes[j] ? 'ativo' : '') + '" onclick="mudarFiltro(\'' + nomes[j] + '\')">' + nomes[j] + '</button>';
  }
  html += '<button class="sem ' + (filtro == 'SEM' ? 'ativo' : '') + '" onclick="mudarFiltro(\'SEM\')">Sem prateleira · ' + semPrateleira + '</button>';

  campo('filtros').innerHTML = html;
}

function mostrarLista() {
  var filtrados = filtrar();

  var totalPaginas = Math.ceil(filtrados.length / produtosPorPagina);
  if (totalPaginas < 1) totalPaginas = 1;
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  if (paginaAtual < 1) paginaAtual = 1;

  var html = '';
  var inicio = (paginaAtual - 1) * produtosPorPagina;
  for (var j = inicio; j < inicio + produtosPorPagina && j < filtrados.length; j++) {
    var i = filtrados[j];
    var p = produtos[i];

    var selos = '<span class="selo selo-SEM">SEM PRATELEIRA</span>';
    if (p.temPosicao) {
      selos = '<span class="selo selo-' + p.nivel + '">' + p.endereco + '</span>';
    }
    if (p.qtd <= p.min) {
      selos += '<span class="selo selo-BAIXO">BAIXO</span>';
    }

    html += '<div class="item' + (i == selecionado ? ' ativo' : '') + '" onclick="escolher(' + i + ')">';
    html += '<div class="item-linha">';
    html += '<span class="item-cod">' + p.codigo + '</span>';
    html += '<span>' + selos + '</span>';
    html += '</div>';
    html += '<p class="item-nome">' + p.nome + '</p>';
    html += '<p class="item-cat">' + p.cat + ' · ' + p.qtd + ' un.</p>';
    html += '</div>';
  }
  if (html == '') {
    html = '<p class="lista-vazia">Nenhum produto encontrado.</p>';
  }

  divItens.innerHTML = html;
  campo('contador').innerHTML = filtrados.length;
  campo('pagina').innerHTML = 'Página ' + paginaAtual + ' de ' + totalPaginas;
  campo('btnAnterior').disabled = paginaAtual == 1;
  campo('btnProxima').disabled = paginaAtual == totalPaginas;
}

function mudarPagina(passo) {
  paginaAtual += passo;
  mostrarLista();
}

function mudarFiltro(novo) {
  filtro = novo;
  paginaAtual = 1;

  // já abre o primeiro produto do filtro escolhido
  var filtrados = filtrar();
  if (filtrados.length > 0) {
    selecionado = filtrados[0];
    mostrarDetalhe(produtos[selecionado]);
  }

  mostrarFiltros();
  mostrarLista();
}

function escolher(numero) {
  selecionado = numero;
  mostrarLista();
  mostrarDetalhe(produtos[numero]);
}

campoBusca.addEventListener('input', function () {
  paginaAtual = 1;
  mostrarLista();
});

// ---------- Detalhe ----------

function desenharBarras(ean) {
  var html = '';

  for (var i = 0; i < ean.length; i++) {
    var n = Number(ean[i]);
    var largura1 = 1 + (n % 3);
    var largura2 = 1 + ((n + 1) % 2);

    html = html + '<i style="width:' + largura1 + 'px;margin-right:1px"></i>';
    html = html + '<i style="width:' + largura2 + 'px;margin-right:2px"></i>';
  }

  campo('d-barras').innerHTML = html;
}

function mostrarDetalhe(p) {
  campo('d-codigo').innerHTML = p.codigo;
  campo('d-nome').innerHTML = p.nome;
  campo('d-categoria').innerHTML = p.cat;

  var nivel = campo('d-nivel');
  if (!p.temPosicao) {
    nivel.className = 'nivel nivel-SEM';
    nivel.innerHTML = 'Sem prateleira<small>Use o botão Prateleira para guardar este produto</small>';
  } else {
    var acesso = 'Requer empilhadeira';
    if (p.nivel == 'GROUND' && p.peso < 20) {
      acesso = 'Acesso manual';
    }
    var nomeNivel = 'Nível alto';
    if (p.nivel == 'GROUND') {
      nomeNivel = 'Nível do solo';
    }
    nivel.className = 'nivel nivel-' + p.nivel;
    nivel.innerHTML = nomeNivel + '<small>' + acesso + '</small>';
  }

  campo('d-comp').innerHTML = p.comp + 'cm';
  campo('d-larg').innerHTML = p.larg + 'cm';
  campo('d-alt').innerHTML = p.alt + 'cm';
  campo('d-peso').innerHTML = p.peso + 'kg';

  campo('d-zona').innerHTML = 'Zona ' + p.zona;
  campo('d-endereco').innerHTML = p.endereco;
  campo('d-etiquetas').innerHTML =
    '<span>Corredor: <b>' + p.corredor + '</b></span>' +
    '<span>Posição: <b>' + p.posicao + '</b></span>' +
    '<span>Prateleira: <b>' + p.prat + '</b></span>';

  desenharBarras(p.ean);
  campo('d-ean').innerHTML = p.ean;

  var qtd = campo('d-qtd');
  var barra = campo('d-barra');

  qtd.innerHTML = p.qtd;
  campo('d-min').innerHTML = p.min;

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

// ---------- Novo produto e edição ----------

var modalFundo = campo('modalFundo');
var modalErro = campo('modalErro');
var editandoId = null; // null quando é um produto novo

function abrirModal(p) {
  modalErro.hidden = true;
  if (p) {
    editandoId = p.id;
    campo('modalTitulo').innerHTML = 'Editar ' + p.codigo;
    campo('btnSalvarProduto').innerHTML = 'Salvar';
  } else {
    editandoId = null;
    campo('modalTitulo').innerHTML = 'Novo produto';
    campo('btnSalvarProduto').innerHTML = 'Continuar'; // o próximo passo é escolher a prateleira
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

campo('formProduto').addEventListener('submit', function (e) {
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
        var novo = editandoId == null;
        var idParaMostrar = novo ? resultado.id : editandoId;
        fecharModal();
        carregarCatalogo(idParaMostrar, function () {
          // produto novo: o próximo passo é escolher a prateleira
          if (novo) abrirPrateleira();
        });
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

// ---------- Prateleira do produto: associar, mudar ou deixar sem ----------

var modalPrateleira = campo('modalPrateleira');
var prateleiraErro = campo('prateleiraErro');
var campoPrateleira = campo('a-prateleira');
var campoNivel = campo('a-nivel');
var campoPosicao = campo('a-posicao');

function posicoesLivres(prateleira) {
  var livres = [];
  for (var i = 0; i < posicoes.length; i++) {
    if (posicoes[i].prateleira == prateleira && !posicoes[i].ocupada) {
      livres.push(posicoes[i]);
    }
  }
  return livres;
}

// As caixas da janela só mostram o que está livre:
// a prateleira define a zona e os níveis, e o nível define as posições (frente ou fundo)
function mostrarNiveis() {
  var livres = posicoesLivres(campoPrateleira.value);
  var nomeNivel = { 1: 'chão', 2: 'meio', 3: 'alto' };

  campo('a-zona').value = livres.length > 0 ? 'Zona ' + livres[0].corredor : '—';

  var html = '';
  for (var nivel = 1; nivel <= 3; nivel++) {
    var temLivre = false;
    for (var i = 0; i < livres.length; i++) {
      if (livres[i].nivel == nivel) temLivre = true;
    }
    if (temLivre) {
      html += '<option value="' + nivel + '">Nível ' + nivel + ' · ' + nomeNivel[nivel] + '</option>';
    }
  }
  if (html == '') {
    html = '<option value="">Nenhum nível livre</option>';
  }
  campoNivel.innerHTML = html;
  mostrarPosicoes();
}

function mostrarPosicoes() {
  var livres = posicoesLivres(campoPrateleira.value);

  var html = '';
  for (var i = 0; i < livres.length; i++) {
    if (livres[i].nivel == campoNivel.value) {
      html += '<option value="' + livres[i].id + '">' + (livres[i].profundidade == 1 ? 'Frente' : 'Fundo') + '</option>';
    }
  }
  if (html == '') {
    html = '<option value="">Nenhuma posição livre</option>';
  }
  campoPosicao.innerHTML = html;
  mostrarEndereco();
}

// Mostra o endereço que o produto vai ter com o que está escolhido nas caixas
function mostrarEndereco() {
  var texto = 'Não há posição livre para escolher.';
  for (var i = 0; i < posicoes.length; i++) {
    var po = posicoes[i];
    if (po.id == campoPosicao.value) {
      var empilhadeira = po.nivel == 3 || po.restrita || produtos[selecionado].peso >= 20;
      texto = 'Novo endereço: <b>' + po.codigo + '</b> · ' + (empilhadeira ? 'requer empilhadeira' : 'acesso manual');
    }
  }
  campo('a-endereco').innerHTML = texto;
}

function abrirPrateleira() {
  var p = produtos[selecionado];
  campo('prateleiraTitulo').innerHTML = 'Prateleira · ' + p.codigo;
  prateleiraErro.hidden = true;

  if (p.temPosicao) {
    campo('prateleiraAtual').innerHTML = p.nome + ' está em <b>' + p.endereco + '</b>. Escolha outra posição para mudar de lugar.';
    campo('btnSemPrateleira').innerHTML = 'Tirar da prateleira';
  } else {
    campo('prateleiraAtual').innerHTML = p.nome + ' está <b>sem prateleira</b>. Escolha onde guardar ou deixe para depois.';
    campo('btnSemPrateleira').innerHTML = 'Deixar sem prateleira';
  }

  // só entram as prateleiras que têm posição livre
  var nomes = nomesDasPrateleiras();
  var html = '';
  for (var i = 0; i < nomes.length; i++) {
    var livres = posicoesLivres(nomes[i]).length;
    if (livres == 0) continue;
    html += '<option value="' + nomes[i] + '"' + (nomes[i] == p.prat ? ' selected' : '') + '>' + nomes[i] + ' · ' + livres + (livres == 1 ? ' livre' : ' livres') + '</option>';
  }
  if (html == '') {
    html = '<option value="">Nenhuma prateleira com espaço</option>';
  }
  campoPrateleira.innerHTML = html;
  mostrarNiveis();

  modalPrateleira.hidden = false;
}

btnPrateleira.addEventListener('click', function () {
  if (produtos.length > 0) {
    abrirPrateleira();
  }
});

campoPrateleira.addEventListener('change', mostrarNiveis);
campoNivel.addEventListener('change', mostrarPosicoes);
campoPosicao.addEventListener('change', mostrarEndereco);

campo('btnCancelarPrateleira').addEventListener('click', function () {
  modalPrateleira.hidden = true;
});

// Manda a mudança de prateleira para a API e recarrega a tela
function salvarPrateleira(caminho, dados) {
  var p = produtos[selecionado];
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
        modalPrateleira.hidden = true;
        carregarCatalogo(p.id);
      });
    })
    .catch(function (erro) {
      prateleiraErro.textContent = erro.message;
      prateleiraErro.hidden = false;
    });
}

campo('formPrateleira').addEventListener('submit', function (e) {
  e.preventDefault();

  if (campoPosicao.value == '') {
    prateleiraErro.textContent = 'Escolha uma posição livre.';
    prateleiraErro.hidden = false;
    return;
  }

  var p = produtos[selecionado];
  salvarPrateleira('/armazenar', { caixaId: p.id, posicaoId: Number(campoPosicao.value) });
});

campo('btnSemPrateleira').addEventListener('click', function () {
  var p = produtos[selecionado];

  if (p.temPosicao) {
    salvarPrateleira('/caixas/' + p.id + '/tirar-da-prateleira', {});
  } else {
    // já está sem prateleira: só fecha e mostra o filtro "Sem prateleira"
    modalPrateleira.hidden = true;
    filtro = 'SEM';
    carregarCatalogo(p.id);
  }
});

// ---------- Início ----------

var agora = new Date();
campo('data').innerHTML = agora.toLocaleString('pt-BR');

function buscar(caminho) {
  return fetch(API + caminho).then(function (resposta) {
    return resposta.json();
  });
}

// Busca o catálogo e as posições. "idParaMostrar" é o produto que fica aberto no detalhe.
function carregarCatalogo(idParaMostrar, depois) {
  Promise.all([buscar('/catalogo'), buscar('/mapa')])
    .then(function (dados) {
      var itens = dados[0];
      posicoes = dados[1];

      produtos = [];
      selecionado = 0;
      for (var i = 0; i < itens.length; i++) {
        produtos.push(converterItem(itens[i]));
        if (itens[i].id == idParaMostrar) {
          selecionado = i;
        }
      }

      // se o produto aberto não aparece no filtro atual, volta para "Todas"
      var filtrados = filtrar();
      if (idParaMostrar != null && filtrados.indexOf(selecionado) == -1) {
        filtro = 'TODAS';
        campoBusca.value = '';
        filtrados = filtrar();
      }
      // vai para a página onde o produto aberto está
      if (idParaMostrar != null) {
        paginaAtual = Math.floor(filtrados.indexOf(selecionado) / produtosPorPagina) + 1;
      }

      mostrarFiltros();
      mostrarLista();
      if (produtos.length > 0) {
        mostrarDetalhe(produtos[selecionado]);
      }
      if (depois) depois();
    })
    .catch(function () {
      divItens.innerHTML = '<p class="lista-vazia">Não foi possível carregar o catálogo. A API está rodando?</p>';
    });
}

carregarCatalogo(null);
