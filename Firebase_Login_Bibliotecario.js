// JS/Firebase_Login_Bibliotecario.js
import { auth, db } from "./Firebase_Auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { Bibliotecario } from "./Models/Bibliotecario.js";

// Elementos do DOM
const loginForm = document.getElementById('loginBiblioForm');
const emailInput = document.getElementById('emailBiblio');
const passwordInput = document.getElementById('passwordBiblio');
const msgDiv = document.getElementById('mensagemLogin') || criarDivMensagem();

// Função para criar a div de mensagem caso não exista
function criarDivMensagem() {
    const div = document.createElement('div');
    div.id = 'mensagemLogin';
    div.className = 'cadMensagem';
    document.body.appendChild(div);
    return div;
}

function mostrarMensagem(texto, tipo = 'sucesso') {
    msgDiv.textContent = texto;
    msgDiv.className = `cadMensagem ${tipo}`;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3500);
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const senha = passwordInput.value;

    if (!email || !senha) {
        mostrarMensagem('Preencha todos os campos!', 'erro');
        return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        // Autenticar no Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Buscar dados no nó "bibliotecarios"
        const bibliotecarioRef = ref(db, `bibliotecarios/${user.uid}`);
        const snapshot = await get(bibliotecarioRef);

        if (!snapshot.exists()) {
            // Se não existir no nó bibliotecarios, faz logout e mostra erro
            await auth.signOut();
            throw new Error('Usuário não é um bibliotecário cadastrado.');
        }

        const data = snapshot.val();
        // Criar instância do Bibliotecario a partir dos dados (opcional)
        const bibliotecario = Bibliotecario.fromJSON(user.uid, data);

        // Armazenar dados no localStorage
        localStorage.setItem('user_UID', bibliotecario.uid);
        localStorage.setItem('user_tipo', bibliotecario.tipo);
        localStorage.setItem('user_email', bibliotecario.email);
        localStorage.setItem('user_nome', bibliotecario.nome);
        localStorage.setItem('user_idBiblioteca', bibliotecario.idBiblioteca);
        localStorage.setItem('log_status', 'true');

        mostrarMensagem('Login realizado com sucesso!', 'sucesso');

        // Redirecionar para a home do bibliotecário (crie esta página depois)
        setTimeout(() => {
            window.location.href = 'home_bibliotecario.html';
        }, 2000);

    } catch (error) {
        console.error('Erro no login:', error);
        let mensagem = 'Erro ao fazer login.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            mensagem = 'E-mail ou senha incorretos.';
        } else if (error.code === 'auth/invalid-email') {
            mensagem = 'E-mail inválido.';
        } else if (error.code === 'auth/too-many-requests') {
            mensagem = 'Muitas tentativas. Tente novamente mais tarde.';
        } else {
            mensagem = error.message;
        }
        mostrarMensagem(mensagem, 'erro');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});