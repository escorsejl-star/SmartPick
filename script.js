const form = document.getElementById('loginForm');
const roles = document.querySelectorAll('.role');
const turnoField = document.getElementById('turnoField');
const erro = document.getElementById('erro');
const usuario = document.getElementById('usuario');
let perfil = 'operador';

function selecionarPerfil(valor) {
  perfil = valor;
  roles.forEach(r => {
    const ativo = r.dataset.role === valor;
    r.classList.toggle('is-active', ativo);
    r.setAttribute('aria-pressed', ativo);
  });
  turnoField.hidden = valor !== 'operador';
  usuario.placeholder = valor === 'operador' ? 'OP-2847' : 'GT-1001';
}
roles.forEach(r => r.addEventListener('click', () => selecionarPerfil(r.dataset.role)));

form.querySelectorAll('.btn').forEach(btn =>
  btn.addEventListener('click', () => selecionarPerfil(btn.dataset.destino))
);

function mostrarErro(msg) {
  erro.textContent = msg;
  erro.hidden = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erro.hidden = true;

  const id = usuario.value.trim();
  const senha = document.getElementById('senha').value;
  const turno = document.getElementById('turno').value;

  if (!id || !senha) return mostrarErro('Informe o ID do usuário e a senha.');

  const botoes = form.querySelectorAll('.btn');
  botoes.forEach(b => (b.disabled = true));

  try {
    
    await new Promise(r => setTimeout(r, 600)); 

    sessionStorage.setItem('logado', 'sim');
    sessionStorage.setItem('perfil', perfil);
    sessionStorage.setItem('usuario', id);
    if (perfil === 'operador') sessionStorage.setItem('turno', turno);
    else sessionStorage.removeItem('turno');

    window.location.href = 'Catalogo.html';
  } catch (err) {
    mostrarErro(err.message || 'Não foi possível entrar. Tente novamente.');
    botoes.forEach(b => (b.disabled = false));
  }
});

selecionarPerfil('operador');
