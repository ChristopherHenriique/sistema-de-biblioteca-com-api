import json
from pathlib import Path
from datetime import date
from flask import Flask, jsonify, request
from flask_cors import CORS

app=Flask(__name__)
CORS(app)
ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"pessoa1_dados"/"bibliotecaVScode"/"data"

def carregar(nome):
    with open(DATA/nome,"r",encoding="utf-8") as f:return json.load(f)
def salvar(nome,dados):
    with open(DATA/nome,"w",encoding="utf-8") as f:json.dump(dados,f,ensure_ascii=False,indent=2)
def novo_id(lista,inicio):
    return max([x.get("id",0) for x in lista],default=inicio-1)+1

@app.get("/")
def home(): return jsonify({"status":"sucesso","fonte_dados":"Pessoa 1 / JSON"})

@app.route("/livros",methods=["GET","POST"])
def livros():
    dados=carregar("livros.json")
    if request.method=="GET": return jsonify(dados)
    x=request.get_json(silent=True) or {}
    if not x.get("titulo") or not x.get("autor"): return jsonify({"erro":"Título e autor são obrigatórios"}),400
    n={"id":novo_id(dados,101),"titulo":x["titulo"],"autor":x["autor"],
       "categoria":x.get("categoria",""),"ano":x.get("ano"),"situacao":x.get("situacao","DISPONIVEL")}
    dados.append(n);salvar("livros.json",dados);return jsonify(n),201

@app.route("/livros/<int:id>",methods=["PUT","DELETE"])
def livro(id):
    dados=carregar("livros.json"); l=next((x for x in dados if x["id"]==id),None)
    if not l:return jsonify({"erro":"Livro não encontrado"}),404
    if request.method=="PUT":
        x=request.get_json(silent=True) or {}
        for k in ["titulo","autor","categoria","ano","situacao"]:
            if k in x:l[k]=x[k]
        salvar("livros.json",dados);return jsonify(l)
    dados=[x for x in dados if x["id"]!=id];salvar("livros.json",dados)
    return jsonify({"mensagem":"Livro excluído"})

@app.route("/emprestimos",methods=["GET","POST"])
def emprestimos():
    dados=carregar("emprestimos.json")
    if request.method=="GET":return jsonify(dados)
    x=request.get_json(silent=True) or {}; lid=x.get("livroId"); uid=x.get("usuarioId")
    if lid is None or uid is None:return jsonify({"erro":"livroId e usuarioId são obrigatórios"}),400
    livros=carregar("livros.json"); usuarios=carregar("usuarios.json")
    l=next((z for z in livros if z["id"]==lid),None)
    u=next((z for z in usuarios if z["id"]==uid),None)
    if not l:return jsonify({"erro":"Livro não encontrado"}),404
    if not u:return jsonify({"erro":"Usuário não encontrado"}),404
    if l["situacao"]!="DISPONIVEL":return jsonify({"erro":"Livro indisponível"}),400
    e={"id":novo_id(dados,501),"livroId":lid,"usuarioId":uid,
       "dataEmprestimo":str(date.today()),"dataDevolucao":None,"status":"ATIVO"}
    l["situacao"]="EMPRESTADO";dados.append(e);salvar("emprestimos.json",dados);salvar("livros.json",livros)
    return jsonify(e),201

@app.post("/emprestimos/<int:id>/devolucao")
def devolver(id):
    dados=carregar("emprestimos.json"); livros=carregar("livros.json")
    e=next((x for x in dados if x["id"]==id),None)
    if not e:return jsonify({"erro":"Empréstimo não encontrado"}),404
    if e["status"]!="ATIVO":return jsonify({"erro":"Empréstimo já finalizado"}),400
    e["status"]="CONCLUIDO";e["dataDevolucao"]=str(date.today())
    l=next((x for x in livros if x["id"]==e["livroId"]),None)
    if l:l["situacao"]="DISPONIVEL"
    salvar("emprestimos.json",dados);salvar("livros.json",livros)
    return jsonify({"mensagem":"Devolução realizada","emprestimo":e})

@app.get("/emprestimos/usuario/<int:usuario_id>")
def meus_emprestimos(usuario_id):
    return jsonify([e for e in carregar("emprestimos.json") if e["usuarioId"]==usuario_id])

if __name__=="__main__":app.run(port=5000,debug=True)
