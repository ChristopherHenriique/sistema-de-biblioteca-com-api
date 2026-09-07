const API_BASE_URL = 'http://127.0.0.1:5000'; 
const sessao = JSON.parse(localStorage.getItem("biblioteca_session") || "null");

if (!sessao || sessao.perfil !== "CLIENTE") {
    alert("Faça login como CLIENTE.");
    window.location.href = "../../pessoa4_login_sessao/index.html";
}

const USUARIO_LOGADO_ID = sessao.usuario.id;

let listaLivros = [];
async function carregarCatalogo() {
  try {
    const res = await fetch(`${API_BASE_URL}/livros`);
    if (!res.ok) throw new Error('Erro ao buscar livros da API');
    
    listaLivros = await res.json();
    filtrarLivros();
  } catch (erro) {
    console.error("Erro na API de livros:", erro);
    const container = document.getElementById('gridLivros');
    if (container) {
      container.innerHTML = '<p>Erro ao carregar o catálogo. Verifique se a API Flask está rodando.</p>';
    }
  }
}
function renderizarLivros(livros) {
  const container = document.getElementById('gridLivros');
  if (!container) return;

  if (!livros || livros.length === 0) {
    container.innerHTML = '<p>Nenhum livro encontrado.</p>';
    return;
  }

  container.innerHTML = livros.map(livro => {
    const isDisponivel = livro.situacao === 'DISPONIVEL';
    
    return `
      <div class="card">
        <h3>${livro.titulo}</h3>
        <p><strong>Autor:</strong> ${livro.autor}</p>
        <p><strong>Categoria:</strong> ${livro.categoria}</p>
        <span class="badge ${isDisponivel ? 'badge-disponivel' : 'badge-emprestado'}">
          ${livro.situacao}
        </span>
        <br><br>
        ${isDisponivel 
          ? `<button onclick="pegarEmprestado(${livro.id})">Pegar Emprestado</button>` 
          : `<button disabled>Indisponível</button>`
        }
      </div>
    `;
  }).join('');
}
function filtrarLivros() {
  const termoInput = document.getElementById('searchInput');
  const categoriaInput = document.getElementById('categoriaInput');

  const termo = termoInput ? termoInput.value.toLowerCase().trim() : '';
  const categoriaDigitada = categoriaInput ? categoriaInput.value.toLowerCase().trim() : '';

  const livrosFiltrados = listaLivros.filter(livro => {
    const bateTexto = (livro.titulo && livro.titulo.toLowerCase().includes(termo)) || 
                      (livro.autor && livro.autor.toLowerCase().includes(termo));
    const bateCategoria = categoriaDigitada === '' || 
                          (livro.categoria && livro.categoria.toLowerCase().includes(categoriaDigitada));

    return bateTexto && bateCategoria;
  });

  renderizarLivros(livrosFiltrados);
}
async function pegarEmprestado(livroId) {
  try {
    const dadosEmprestimo = {
      livroId: livroId,
      usuarioId: USUARIO_LOGADO_ID
    };

    const res = await fetch(`${API_BASE_URL}/emprestimos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosEmprestimo)
    });

    if (!res.ok) {
      const erroApi = await res.json();
      throw new Error(erroApi.erro || 'Não foi possível realizar o empréstimo');
    }

    alert('Empréstimo realizado com sucesso!');
    
    await carregarCatalogo();
    await renderizarMeusEmprestimos();
  } catch (erro) {
    console.error("Erro ao solicitar empréstimo:", erro);
    alert(`Erro: ${erro.message}`);
  }
}
async function renderizarMeusEmprestimos() {
  const container = document.getElementById('gridEmprestimos');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/emprestimos`);
    if (!res.ok) throw new Error('Erro ao buscar empréstimos');

    const todosEmprestimos = await res.json();
    const meusEmp = todosEmprestimos.filter(emp => emp.usuarioId === USUARIO_LOGADO_ID && emp.status === 'ATIVO');

    if (meusEmp.length === 0) {
      container.innerHTML = '<p>Você não possui nenhum empréstimo ativo no momento.</p>';
      return;
    }

    container.innerHTML = meusEmp.map(emp => {
      const livro = listaLivros.find(l => l.id === emp.livroId);
      return `
        <div class="card">
          <h3>${livro ? livro.titulo : 'Livro ID: ' + emp.livroId}</h3>
          <p><strong>Data de Empréstimo:</strong> ${emp.dataEmprestimo}</p>
          <button onclick="devolverLivro(${emp.id})">Devolver</button>
        </div>
      `;
    }).join('');

  } catch (erro) {
    console.error("Erro ao buscar meus empréstimos:", erro);
    container.innerHTML = '<p>Erro ao carregar seus empréstimos.</p>';
  }
}
async function devolverLivro(emprestimoId) {
  try {
    const res = await fetch(`${API_BASE_URL}/emprestimos/${emprestimoId}/devolucao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const erroApi = await res.json();
      throw new Error(erroApi.erro || 'Erro ao devolver livro');
    }

    alert('Livro devolvido com sucesso!');

    await carregarCatalogo();
    await renderizarMeusEmprestimos();
  } catch (erro) {
    console.error("Erro na devolução:", erro);
    alert(`Erro: ${erro.message}`);
  }
}
async function iniciarApp() {
  await carregarCatalogo();
  await renderizarMeusEmprestimos();
}

iniciarApp();

function sair() {
    localStorage.removeItem("biblioteca_session");
    window.location.href = "../../pessoa4_login_sessao/index.html";
}
