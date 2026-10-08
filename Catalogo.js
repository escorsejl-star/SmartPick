// Confere se fez login; sem sessão, volta para a tela de login.
if (sessionStorage.getItem('logado') !== 'sim') {
  window.location.href = 'index.html';
}

const produtos = [
  { codigo: 'TN-5501', nome: 'Tênis Nike Air Max 270', cat: 'Calçados', qtd: 48, min: 10, nivel: 'GROUND', comp: 35, larg: 22, alt: 15, peso: 1.8, zona: 'A', corredor: 'A', posicao: '03', prat: 'P1', ean: '7891000055012' },
  { codigo: 'TV-8801', nome: 'Smart TV Samsung 55" QLED', cat: 'Eletrônicos', qtd: 6, min: 3, nivel: 'HIGH', comp: 123, larg: 15, alt: 71, peso: 17.5, zona: 'C', corredor: 'C', posicao: '01', prat: 'P4', ean: '7891000088014' },
  { codigo: 'NB-3201', nome: 'Notebook Dell Inspiron 15', cat: 'Eletrônicos', qtd: 12, min: 5, nivel: 'GROUND', comp: 38, larg: 26, alt: 4, peso: 1.9, zona: 'B', corredor: 'B', posicao: '07', prat: 'P2', ean: '7891000032013' },
  { codigo: 'CA-7710', nome: 'Câmera Canon EOS R50', cat: 'Eletrônicos', qtd: 3, min: 5, nivel: 'GROUND', comp: 12, larg: 9, alt: 8, peso: 0.7, zona: 'B', corredor: 'B', posicao: '09', prat: 'P1', ean: '7891000077106' },
  { codigo: 'CH-1142', nome: 'Chuveiro Lorenzetti Advanced', cat: 'Elétricos', qtd: 22, min: 8, nivel: 'GROUND', comp: 20, larg: 20, alt: 12, peso: 0.9, zona: 'D', corredor: 'D', posicao: '02', prat: 'P2', ean: '7891000011425' },
  { codigo: 'SD-5501', nome: 'Sofá 3 Lugares Revestido', cat: 'Móveis', qtd: 4, min: 2, nivel: 'HIGH', comp: 210, larg: 90, alt: 85, peso: 42, zona: 'E', corredor: 'E', posicao: '01', prat: 'P5', ean: '7891000055019' },
  { codigo: 'AQ-2250', nome: 'Ar Cond. Midea 12000 BTU', cat: 'Eletrônicos', qtd: 8, min: 4, nivel: 'HIGH', comp: 80, larg: 30, alt: 28, peso: 11, zona: 'C', corredor: 'C', posicao: '05', prat: 'P4', ean: '7891000022504' },
  { codigo: 'BL-0011', nome: 'Blusa Polo Lacoste P', cat: 'Vestuário', qtd: 65, min: 20, nivel: 'GROUND', comp: 30, larg: 25, alt: 3, peso: 0.3, zona: 'A', corredor: 'A', posicao: '12', prat: 'P1', ean: '7891000000115' }
];

let selecionado = 0;
let editando = false;
const campoBusca = document.getElementById('busca');
const divItens = document.getElementById('itens');
const contador = document.getElementById('contador');
const btnEditar = document.getElementById('btnEditar');
const btnSalvar = document.getElementById('btnSalvar');
const titulo = document.getElementById('d-nome');

function mostrarLista(texto) {
  const termo = texto.toLowerCase();
  const filtrados = produtos
    .map((produto, indice) => ({ produto, indice }))
    .filter(({ produto }) => `${produto.codigo} ${produto.nome}`.toLowerCase().includes(termo));

  divItens.innerHTML = filtrados.map(({ produto, indice }) => {
    const selos = `<span class="selo selo-${produto.nivel}">${produto.nivel}</span>${produto.qtd <= produto.min ? '<span class="selo selo-BAIXO">BAIXO</span>' : ''}`;
    return `<button type="button" class="item${indice === selecionado ? ' ativo' : ''}" data-indice="${indice}">
      <span class="item-linha"><span class="item-cod">${produto.codigo}</span><span>${selos}</span></span>
      <span class="item-nome">${produto.nome}</span>
      <span class="item-cat">${produto.cat} · ${produto.qtd} un.</span>
    </button>`;
  }).join('');
  contador.textContent = filtrados.length;
}

function desenharBarras(ean) {
  let html = '';
  for (const digito of ean) {
    const numero = Number(digito);
    html += `<i style="width:${1 + (numero % 3)}px;margin-right:1px"></i>`;
    html += `<i style="width:${1 + ((numero + 1) % 2)}px;margin-right:2px"></i>`;
  }
  document.getElementById('d-barras').innerHTML = html;
}

function mostrarDetalhe(produto) {
  document.getElementById('d-codigo').textContent = produto.codigo;
  titulo.textContent = produto.nome;
  document.getElementById('d-categoria').textContent = produto.cat;

  const acesso = produto.nivel === 'GROUND' ? 'Acesso manual' : 'Requer empilhadeira';
  const nivel = document.getElementById('d-nivel');
  nivel.className = `nivel nivel-${produto.nivel}`;
  nivel.innerHTML = `Nível do Solo — ${produto.nivel}<small>${acesso}</small>`;

  document.getElementById('d-comp').textContent = `${produto.comp}cm`;
  document.getElementById('d-larg').textContent = `${produto.larg}cm`;
  document.getElementById('d-alt').textContent = `${produto.alt}cm`;
  document.getElementById('d-peso').textContent = `${produto.peso}kg`;
  document.getElementById('d-zona').textContent = `Zona ${produto.zona}`;
  document.getElementById('d-endereco').textContent = `${produto.corredor}-${produto.posicao}-${produto.prat}`;
  document.getElementById('d-etiquetas').innerHTML =
    `<span>Corredor: <b>${produto.corredor}</b></span>` +
    `<span>Posição: <b>${produto.posicao}</b></span>` +
    `<span>Prateleira: <b>${produto.prat}</b></span>`;

  desenharBarras(produto.ean);
  document.getElementById('d-ean').textContent = produto.ean;

  const qtd = document.getElementById('d-qtd');
  const barra = document.getElementById('d-barra');
  qtd.textContent = produto.qtd;
  document.getElementById('d-min').textContent = produto.min;
  barra.style.width = `${Math.min((produto.qtd / (produto.min * 2)) * 100, 100)}%`;
  qtd.className = produto.qtd <= produto.min ? 'qtd baixo' : 'qtd';
  barra.className = produto.qtd <= produto.min ? 'barra-cheia baixo' : 'barra-cheia';
}

divItens.addEventListener('click', event => {
  const item = event.target.closest('[data-indice]');
  if (!item) return;
  selecionado = Number(item.dataset.indice);
  mostrarLista(campoBusca.value);
  mostrarDetalhe(produtos[selecionado]);
});

campoBusca.addEventListener('input', () => mostrarLista(campoBusca.value));

btnEditar.addEventListener('click', () => {
  if (!editando) {
    editando = true;
    titulo.contentEditable = 'true';
    titulo.focus();
    btnEditar.textContent = 'Cancelar';
    return;
  }
  editando = false;
  titulo.contentEditable = 'false';
  btnEditar.textContent = 'Editar';
  mostrarDetalhe(produtos[selecionado]);
});

btnSalvar.addEventListener('click', () => {
  if (!editando) return;
  produtos[selecionado].nome = titulo.textContent.trim();
  titulo.contentEditable = 'false';
  btnEditar.textContent = 'Editar';
  editando = false;
  mostrarLista(campoBusca.value);
});

document.getElementById('data').textContent = new Date().toLocaleString('pt-BR');
document.getElementById('btnSair').addEventListener('click', () => sessionStorage.clear());
mostrarLista('');
mostrarDetalhe(produtos[0]);
