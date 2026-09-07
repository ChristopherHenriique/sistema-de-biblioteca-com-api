from fastapi import FastAPI, HTTPException, Request, Query
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json, uuid

app = FastAPI(title="API Pessoa 2 - Usuários e Autenticação")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])

BASE = Path(__file__).resolve().parents[2]
USUARIOS = BASE / "pessoa1_dados" / "bibliotecaVScode" / "data" / "usuarios.json"
sessoes = {}

def ler_usuarios():
    with open(USUARIOS, "r", encoding="utf-8") as f: return json.load(f)

def salvar_usuarios(dados):
    with open(USUARIOS, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)

@app.middleware("http")
async def middleware_autorizacao(request: Request, call_next):
    if request.url.path.startswith("/usuarios") and request.method == "DELETE":
        token=request.query_params.get("token")
        if not token or token not in sessoes:
            return JSONResponse(status_code=401, content={"detail":"Token inválido ou não informado"})
        request.state.usuario_logado=sessoes[token]
    return await call_next(request)

class Usuario(BaseModel):
    nome:str; email:str; senha:str; tipo:str="CLIENTE"
class Login(BaseModel):
    email:str; senha:str

@app.get("/")
def inicio(): return {"mensagem":"API Pessoa 2 funcionando","dados":"Pessoa 1 / usuarios.json"}

@app.get("/usuarios")
def listar_usuarios():
    return [{k:v for k,v in u.items() if k!="senha"} for u in ler_usuarios()]

@app.post("/usuarios")
def criar_usuario(usuario:Usuario, token:str=None):
    usuarios=ler_usuarios()
    if usuario.tipo != "CLIENTE":
        if not token or token not in sessoes:
            raise HTTPException(401,"É necessário estar logado como ADM para criar ATENDENTE ou ADM")

        logado=sessoes[token]
        if logado["tipo"]!="ADM":
            raise HTTPException(403,"Apenas ADM pode criar ATENDENTE ou ADM")

    if any(u["email"].lower()==usuario.email.lower() for u in usuarios):
        raise HTTPException(400,"Este e-mail já está cadastrado")

    novo={"id":max([u["id"] for u in usuarios],default=0)+1,
          "nome":usuario.nome,"email":usuario.email,"senha":usuario.senha,"tipo":usuario.tipo}

    usuarios.append(novo)
    salvar_usuarios(usuarios)
    return {k:v for k,v in novo.items() if k!="senha"}

@app.post("/login")
def fazer_login(login:Login):
    for u in ler_usuarios():
        if u["email"].lower()==login.email.lower() and u["senha"]==login.senha:
            token=str(uuid.uuid4()); sessoes[token]=u
            return {"mensagem":"Login realizado com sucesso",
                    "usuario":{"id":u["id"],"nome":u["nome"],"email":u["email"]},
                    "tipo":u["tipo"],"token":token}
    raise HTTPException(401,"E-mail ou senha incorretos")

@app.get("/sessao")
def sessao(token:str=Query(...)):
    u=sessoes.get(token)
    if not u: raise HTTPException(401,"Token inválido")
    return {"usuario":{"id":u["id"],"nome":u["nome"],"email":u["email"]},"tipo":u["tipo"]}

@app.delete("/usuarios/{id}")
def excluir_usuario(id:int,request:Request,token:str=Query(...)):
    logado=request.state.usuario_logado
    usuarios=ler_usuarios()
    alvo=next((u for u in usuarios if u["id"]==id),None)
    if not alvo: raise HTTPException(404,"Usuário não encontrado")
    if logado["tipo"]=="CLIENTE": raise HTTPException(403,"CLIENTE não tem permissão")
    if logado["tipo"]=="ATENDENTE" and alvo["tipo"]=="ADM":
        raise HTTPException(403,"ATENDENTE não pode excluir ADM")
    usuarios.remove(alvo); salvar_usuarios(usuarios)
    return {"mensagem":"Usuário excluído com sucesso"}
