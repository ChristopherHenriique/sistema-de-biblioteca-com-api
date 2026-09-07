const A2="http://127.0.0.1:8000",A3="http://127.0.0.1:5000";
const s=JSON.parse(localStorage.getItem("biblioteca_session")||"null");
if(!s||!["ADM","ATENDENTE"].includes(s.perfil)){alert("Acesso restrito.");location.href="../pessoa4_login_sessao/index.html"}
user.textContent=`${s.usuario.nome} — ${s.perfil}`;
let livros=[],usuarios=[],emprestimos=[];
async function req(base,url,opt={}){let r=await fetch(base+url,opt),d=await r.json();if(!r.ok)throw Error(d.detail||d.erro||"Erro");return d}
function abrir(id){document.querySelectorAll("main section").forEach(x=>x.hidden=x.id!==id);carregar()}
function sair(){localStorage.removeItem("biblioteca_session");location.href="../pessoa4_login_sessao/index.html"}
async function carregar(){try{[livros,usuarios,emprestimos]=await Promise.all([req(A3,"/livros"),req(A2,"/usuarios"),req(A3,"/emprestimos")]);render()}catch(e){alert("Erro de conexão: "+e.message)}}
function render(){qLivros.textContent=livros.length;qUsuarios.textContent=usuarios.length;qEmp.textContent=emprestimos.length;qDisp.textContent=livros.filter(l=>l.situacao==="DISPONIVEL").length;
 tbLivros.innerHTML=livros.map(l=>`<tr><td>${l.id}</td><td>${l.titulo}</td><td>${l.autor}</td><td>${l.categoria||"-"}</td><td>${l.situacao}</td><td><button onclick="delLivro(${l.id})">Excluir</button></td></tr>`).join("");
 tbUsuarios.innerHTML=usuarios.map(u=>`<tr><td>${u.id}</td><td>${u.nome}</td><td>${u.email}</td><td>${u.tipo}</td><td>${u.id===s.usuario.id?"—":`<button onclick="delUser(${u.id})">Excluir</button>`}</td></tr>`).join("");
 const L=Object.fromEntries(livros.map(x=>[x.id,x.titulo])),U=Object.fromEntries(usuarios.map(x=>[x.id,x.nome]));
 tbEmp.innerHTML=emprestimos.map(e=>{
 const usuario=U[e.usuarioId]||("Usuário #"+e.usuarioId);
 const livro=L[e.livroId]||("Livro #"+e.livroId);
 const status=e.status==="ATIVO"?"ALUGADO":"DEVOLVIDO";
 return `<tr>
   <td>${e.id}</td>
   <td>${usuario}</td>
   <td>${livro}</td>
   <td>${e.dataEmprestimo}</td>
   <td>${e.dataDevolucao||"-"}</td>
   <td>${status}</td>
 </tr>`;
}).join("");
}
formLivro.onsubmit=async e=>{e.preventDefault();await req(A3,"/livros",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({titulo:titulo.value,autor:autor.value,categoria:categoria.value,ano:ano.value?+ano.value:null})});e.target.reset();carregar()};
formUsuario.onsubmit=async e=>{
 e.preventDefault();

 if(s.perfil==="ATENDENTE" && tipo.value==="ADM"){
   return alert("Erro: ATENDENTE não tem permissão para criar um ADM.");
 }

 try{
   await req(A2,"/usuarios?token="+encodeURIComponent(s.token),{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
       nome:nome.value,
       email:email.value,
       senha:senhaNovo.value,
       tipo:tipo.value
     })
   });

   e.target.reset();
   alert("Usuário cadastrado com sucesso.");
   carregar();

 }catch(err){
   alert("Erro ao cadastrar usuário: "+err.message);
 }
};
async function delLivro(id){if(confirm("Excluir livro?")){await req(A3,"/livros/"+id,{method:"DELETE"});carregar()}}
async function delUser(id){
 const alvo=usuarios.find(u=>u.id===id);

 if(s.perfil==="ATENDENTE" && alvo && alvo.tipo==="ADM"){
   alert("Erro: ATENDENTE não tem permissão para apagar um ADM.");
   return;
 }

 if(!confirm("Excluir usuário?")) return;

 try{
   await req(A2,"/usuarios/"+id+"?token="+encodeURIComponent(s.token),{method:"DELETE"});
   carregar();
 }catch(e){
   alert("Erro: "+e.message);
 }
}
buscaLivro.oninput=()=>{let q=buscaLivro.value.toLowerCase();document.querySelectorAll("#tbLivros tr").forEach(tr=>tr.hidden=!tr.textContent.toLowerCase().includes(q))}
carregar();