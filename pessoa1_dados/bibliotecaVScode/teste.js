const repo = require('./jsonRepository');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function perguntar(texto) {
  return new Promise((resolve) => rl.question(texto, resolve));
}

async function cadastrarUsuario() {
  console.log('\n=== CADASTRO DE NOVO USUÁRIO ===');
  const nome = await perguntar('Digite o Nome: ');
  const email = await perguntar('Digite o E-mail: ');
  const senha = await perguntar('Digite a Senha: ');

  console.log('\nEscolha o Tipo de Usuário:');
  console.log('1. CLIENTE');
  console.log('2. ATENDENTE');
  console.log('3. ADM');
  const opcaoTipo = await perguntar('Opção (1, 2 ou 3): ');

  let tipo = 'CLIENTE';
  if (opcaoTipo === '2') tipo = 'ATENDENTE';
  if (opcaoTipo === '3') tipo = 'ADM';

  try {

    const usuarios = await repo.ler('usuarios');

    const novoId = await repo.gerarProximoId('usuarios');

    const novoUsuario = {
      id: novoId,
      nome: nome,
      email: email,
      senha: senha, 
      tipo: tipo
    };

    usuarios.push(novoUsuario);
    await repo.salvar('usuarios', usuarios);

    console.log(`\n✅ Usuário "${nome}" (ID: ${novoId}) cadastrado com sucesso!`);

  } catch (erro) {
    console.error('❌ Erro ao cadastrar usuário:', erro.message);
  }

  const continuar = await perguntar('\nDeseja cadastrar outro usuário? (s/n): ');
  if (continuar.toLowerCase() === 's') {
    await cadastrarUsuario();
  } else {
    console.log('\nSaindo do cadastro. Até mais!');
    rl.close();
  }
}

cadastrarUsuario();