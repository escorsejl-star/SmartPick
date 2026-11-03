var API = 'http://localhost:5000';

var form = document.getElementById('loginForm');
var cards = document.querySelectorAll('.role');
var campoTurno = document.getElementById('turnoField');
var msgErro = document.getElementById('erro');
var campoUsuario = document.getElementById('usuario');
var campoSenha = document.getElementById('senha');
var campoSelectTurno = document.getElementById('turno');
var botoes = document.querySelectorAll('.btn');

var perfil = 'operador';

function escolherPerfil(novo) {
  perfil = novo;

  for (var i = 0; i < cards.length; i++) {
    var ativo = cards[i].dataset.role == novo;
    if (ativo) {
      cards[i].classList.add('is-active');
    } else {
      cards[i].classList.remove('is-active');
    }
    cards[i].setAttribute('aria-pressed', ativo);
  }

  if (novo == 'operador') {
    campoTurno.hidden = false;
    campoUsuario.placeholder = 'OP-2847';
  } else {
    campoTurno.hidden = true;
    campoUsuario.placeholder = 'GT-1001';
  }
}

for (var i = 0; i < cards.length; i++) {
  cards[i].addEventListener('click', function () {
    escolherPerfil(this.dataset.role);
  });
}

for (var j = 0; j < botoes.length; j++) {
  botoes[j].addEventListener('click', function () {
    escolherPerfil(this.dataset.destino);
  });
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  var usuario = campoUsuario.value.trim();
  var senha = campoSenha.value;

  if (usuario == '' || senha == '') {
    msgErro.textContent = 'Preencha o ID e a senha!';
    msgErro.hidden = false;
    return;
  }

  msgErro.hidden = true;

  fetch(API + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: usuario, senha: senha, perfil: perfil })
  })
    .then(function (resposta) {
      if (resposta.status >= 500) {
        throw new Error('Erro no servidor. Veja a mensagem no terminal da API.');
      }
      return resposta.json().then(function (dados) {
        if (!resposta.ok) {
          throw new Error(dados.erro);
        }
        return dados;
      });
    })
    .then(function (dados) {
      sessionStorage.setItem('logado', 'sim');
      sessionStorage.setItem('perfil', dados.perfil);
      sessionStorage.setItem('usuario', dados.login);
      sessionStorage.setItem('nome', dados.nome);
      if (dados.perfil == 'operador') {
        sessionStorage.setItem('turno', campoSelectTurno.value);
      } else {
        sessionStorage.removeItem('turno');
      }

      window.location.href = 'overview.html';
    })
    .catch(function (erro) {
      if (erro.message == 'Failed to fetch') {
        msgErro.textContent = 'Não foi possível falar com o servidor. A API está rodando?';
      } else {
        msgErro.textContent = erro.message;
      }
      msgErro.hidden = false;
    });
});

escolherPerfil('operador');
