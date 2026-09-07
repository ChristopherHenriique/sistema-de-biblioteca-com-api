const fs = require('fs').promises;
const path = require('path');

const CAMINHOS = {
  usuarios: path.join(__dirname, 'data', 'usuarios.json'),
  livros: path.join(__dirname, 'data', 'livros.json'),
  emprestimos: path.join(__dirname, 'data', 'emprestimos.json')
};

let bloqueado = false;

async function ler(nomeColecao) {
  const caminho = CAMINHOS[nomeColecao];
  const dadosTexto = await fs.readFile(caminho, 'utf-8');
  return JSON.parse(dadosTexto);
}
async function salvar(nomeColecao, dados) {
  const caminho = CAMINHOS[nomeColecao];
  while (bloqueado) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  try {
    bloqueado = true; 
    const textoFormatado = JSON.stringify(dados, null, 2);
    await fs.writeFile(caminho, textoFormatado, 'utf-8');
  } finally {
    bloqueado = false; 
  }
}
async function gerarProximoId(nomeColecao) {
  const lista = await ler(nomeColecao);
  if (lista.length === 0) return 1;
  const maiorId = Math.max(...lista.map(item => item.id));
  return maiorId + 1;
}

module.exports = {
  ler,
  salvar,
  gerarProximoId
};