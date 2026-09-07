const API2 = "http://127.0.0.1:8000";

const msg = document.getElementById("msg");
const areaLogin = document.getElementById("areaLogin");
const areaCadastro = document.getElementById("areaCadastro");

function mostrarMensagem(texto, erro = true) {
    msg.textContent = texto;
    msg.style.color = erro ? "#b00020" : "#137333";
}

document.getElementById("abrirCadastro").onclick = () => {
    areaLogin.hidden = true;
    areaCadastro.hidden = false;
    msg.textContent = "";
};

document.getElementById("voltarLogin").onclick = () => {
    areaCadastro.hidden = true;
    areaLogin.hidden = false;
    msg.textContent = "";
};

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarMensagem("Entrando...", false);

    try {
        const r = await fetch(API2 + "/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                email: document.getElementById("email").value,
                senha: document.getElementById("senha").value
            })
        });

        const d = await r.json();

        if (!r.ok) {
            throw new Error(d.detail || "Erro no login");
        }

        localStorage.setItem("biblioteca_session", JSON.stringify({
            token: d.token,
            usuario: d.usuario,
            perfil: d.tipo
        }));

        if (d.tipo === "CLIENTE") {
            location.href = "../pessoa5_cliente/pasta do vitao/index.html";
        } else {
            location.href = "../pessoa6_painel/index.html";
        }

    } catch (err) {
        mostrarMensagem(err.message);
    }
});

document.getElementById("cadastroForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const r = await fetch(API2 + "/usuarios", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                nome: document.getElementById("cadNome").value.trim(),
                email: document.getElementById("cadEmail").value.trim(),
                senha: document.getElementById("cadSenha").value,
                tipo: "CLIENTE"
            })
        });

        const d = await r.json();

        if (!r.ok) {
            throw new Error(d.detail || "Não foi possível cadastrar");
        }

        document.getElementById("cadastroForm").reset();
        areaCadastro.hidden = true;
        areaLogin.hidden = false;
        mostrarMensagem("Cliente cadastrado com sucesso. Agora faça login.", false);

    } catch (err) {
        mostrarMensagem(err.message);
    }
});
