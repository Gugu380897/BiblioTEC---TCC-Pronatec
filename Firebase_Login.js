// JS/Firebase_Login.js
import { auth, db } from "./Firebase_Auth.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { Leitor } from "./Models/Leitor.js";
import { Estudante } from "./Models/Estudante.js";

// Elementos do DOM
const btnAluno = document.getElementById('btnAluno');
const btnLeitor = document.getElementById('btnLeitor');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('login');
const passwordInput = document.getElementById('password');
const msgDiv = document.getElementById('mensagemLogin');

let tipoSelecionado = 'aluno'; // padrão

function mostrarMensagem(texto, tipo = 'sucesso') {
    if (!msgDiv) {
        console.error("Div 'mensagemLogin' não encontrada!");
        return;
    }
    msgDiv.textContent = texto;
    msgDiv.className = `logMensagem ${tipo}`;
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.style.display = 'none', 3500);
}

function ativarAluno() {
    btnAluno.classList.add('active');
    btnLeitor.classList.remove('active');
    tipoSelecionado = 'aluno';
    emailInput.placeholder = 'E-mail (@aluno.ce.gov.br)';
    emailInput.value = '';
    passwordInput.value = '';
}

function ativarLeitor() {
    btnLeitor.classList.add('active');
    btnAluno.classList.remove('active');
    tipoSelecionado = 'leitor';
    emailInput.placeholder = 'E-mail';
    emailInput.value = '';
    passwordInput.value = '';
}

btnAluno.addEventListener('click', ativarAluno);
btnLeitor.addEventListener('click', ativarLeitor);
ativarAluno();

async function loginUser(email, senha) {
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        // Validações
        if (!email || !senha) throw new Error('Preencha todos os campos!');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw new Error('E-mail inválido.');
        if (tipoSelecionado === 'aluno' && !email.toLowerCase().endsWith('@aluno.ce.gov.br')) {
            throw new Error('E-mail não pertencente a um usuario estudante.');
        }
        if (tipoSelecionado === 'leitor' && email.toLowerCase().endsWith('@aluno.ce.gov.br')) {
            throw new Error('E-mail não pertencente a um usuario leitor.');
        }
        if (senha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

        console.log("Tentando login com:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        console.log("Usuário autenticado:", user.uid);

        // Buscar dados do usuário no Realtime Database
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const data = snapshot.val();
        console.log("Dados do Realtime Database:", data);

        let usuario;
        if (data.tipo === 'estudante') {
            usuario = Estudante.fromJSON(user.uid, data);
        } else if (data.tipo === 'leitor') {
            usuario = Leitor.fromJSON(user.uid, data);
        } else {
            throw new Error('Tipo de usuário inválido: ' + data.tipo);
        }

        // Verificar compatibilidade de tipo
        if (tipoSelecionado === 'aluno' && usuario.tipo !== 'estudante') {
            throw new Error('Esta conta não é de um aluno.');
        }
        if (tipoSelecionado === 'leitor' && usuario.tipo !== 'leitor') {
            throw new Error('Esta conta não é de um usuário leitor.');
        }

        // Armazenar dados no localStorage
        localStorage.setItem('user_UID', usuario.uid);
        localStorage.setItem('user_tipo', usuario.tipo);
        localStorage.setItem('user_email', usuario.email);
        localStorage.setItem('user_nome', usuario.nome || '');
        localStorage.setItem('log_status', 'true');

        // Tudo certo! Mostrar mensagem e redirecionar
        mostrarMensagem('Login realizado com sucesso!', 'sucesso');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3500);

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
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const senha = passwordInput.value;
    if (!email || !senha) {
        mostrarMensagem('Preencha todos os campos!', 'erro');
        return;
    }
    await loginUser(email, senha);
});

// Elementos do modal de reset
const btnEsqueciSenha = document.getElementById('esqueciSenha');
const modalReset = document.getElementById('modalResetSenha');
const closeModal = document.querySelector('.close-modal');
const formReset = document.getElementById('formResetSenha');

// Abrir modal
btnEsqueciSenha.addEventListener('click', () => {
    modalReset.style.display = 'flex';
});

// Fechar modal
closeModal.addEventListener('click', () => {
    modalReset.style.display = 'none';
});

// Fechar ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === modalReset) {
        modalReset.style.display = 'none';
    }
});

// Enviar e-mail de redefinição
formReset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailReset').value.trim();
    if (!email) {
        mostrarMensagem('Digite um e-mail válido.', 'erro');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        mostrarMensagem('E-mail de redefinição enviado!', 'sucesso');
        modalReset.style.display = 'none';
        formReset.reset();
    } catch (error) {
        console.error(error);
        let msg = 'Erro ao enviar e-mail.';
        if (error.code === 'auth/user-not-found') {
            msg = 'E-mail não cadastrado.';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'E-mail inválido.';
        }
        mostrarMensagem(msg, 'erro');
    }
});