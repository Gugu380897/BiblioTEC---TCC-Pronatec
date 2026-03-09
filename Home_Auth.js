// Home_Auth.js
import { auth, db } from "./Firebase_Auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Home_Auth.js carregado");

// ELEMENTOS DO DOM
const userNameEl = document.querySelector('.user-name');
const userEmailEl = document.querySelector('.user-email');
const userTypeEl = document.querySelector('.user-type');
const logoutItem = document.querySelector('.logout');
const loginItems = document.querySelectorAll('.login');
const userMenuItems = document.querySelectorAll('.user-menu-item');
const loggedContent = document.getElementById('logged-content');
const blockedMessage = document.getElementById('blocked-message');
const loadingState = document.getElementById('loading-state');

// FUNÇÃO PARA CONTROLAR LOADER
function setLoading(isLoading) {
    if (loadingState) {
        loadingState.style.display = isLoading ? 'flex' : 'none';
    }
}

// FUNÇÃO PARA ATUALIZAR A INTERFACE
async function updateUI(user) {
    console.log("updateUI executando. user:", user);

    // Esconde o loader assim que temos uma decisão
    setLoading(false);

    if (user) {
        // USUÁRIO LOGADO
        console.log("Usuário logado, UID:", user.uid);

        // Menu: esconde login/cadastro, mostra itens do usuário e logout
        loginItems.forEach(el => { if (el) el.style.display = 'none'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'block'; });
        if (logoutItem) logoutItem.style.display = 'block';

        // Conteúdo: mostra biblioteca, esconde bloqueio
        if (loggedContent) loggedContent.style.display = 'block';
        if (blockedMessage) blockedMessage.style.display = 'none';

        // Buscar dados no Realtime Database
        try {
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            console.log("Dados do Realtime Database:", snapshot.val());

            if (snapshot.exists()) {
                const data = snapshot.val();

                // Nome (pode vir de campos diferentes)
                if (data.nome) userNameEl.textContent = data.nome;
                else if (data.idEstudante) userNameEl.textContent = data.idEstudante;
                else userNameEl.textContent = "Usuário";

                // Email
                userEmailEl.textContent = user.email;

                // Tipo
                if (data.tipo === 'estudante') userTypeEl.textContent = "Estudante";
                else if (data.tipo === 'leitor') userTypeEl.textContent = "Leitor";
                else userTypeEl.textContent = "Usuário";
            } else {
                console.warn("Documento do usuário não encontrado no Realtime Database");
                userNameEl.textContent = "Usuário";
                userEmailEl.textContent = user.email;
                userTypeEl.textContent = "Usuário";
            }
        } catch (error) {
            console.error("Erro ao buscar dados do Realtime Database:", error);
            userNameEl.textContent = "Usuário";
            userEmailEl.textContent = user.email;
            userTypeEl.textContent = "Usuário";
        }
    } else {
        // USUÁRIO NÃO LOGADO
        console.log("Nenhum usuário logado");

        // Menu: mostra login/cadastro, esconde itens do usuário e logout
        loginItems.forEach(el => { if (el) el.style.display = 'block'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'none'; });
        if (logoutItem) logoutItem.style.display = 'none';

        // Conteúdo: esconde biblioteca, mostra bloqueio
        if (loggedContent) loggedContent.style.display = 'none';
        if (blockedMessage) blockedMessage.style.display = 'flex';

        // Placeholder
        userNameEl.textContent = "Visitante";
        userEmailEl.textContent = "Faça login para acessar";
        userTypeEl.textContent = "Não logado";
    }
}

// OBSERVADOR DE AUTENTICAÇÃO
auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged disparado:", user);
    updateUI(user);
});

// LOGOUT
if (logoutItem) {
    logoutItem.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Logout clicado");
        signOut(auth)
            .then(() => {
                console.log("Logout bem-sucedido");
                // O observer já vai atualizar a UI
            })
            .catch(err => console.error("Erro no logout:", err));
    });
}

// INICIALIZAÇÃO
// Mostra o loader enquanto o Firebase não decidiu
setLoading(true);