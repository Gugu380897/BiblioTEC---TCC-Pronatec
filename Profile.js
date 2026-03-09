// JS/Profile_Auth.js
import { auth, db } from "./Firebase_Auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Profile_Auth.js carregado");

// ELEMENTOS DO DOM
const menuLigar = document.getElementById('menuLigar');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');
const userNameEl = document.querySelector('.user-name');
const userEmailEl = document.querySelector('.user-email');
const userTypeEl = document.querySelector('.user-type');
const logoutItem = document.querySelector('.logout');
const loginItems = document.querySelectorAll('.login');
const userMenuItems = document.querySelectorAll('.user-menu-item');
const loggedContent = document.getElementById('logged-content');
const blockedMessage = document.getElementById('blocked-message');
const loadingState = document.getElementById('loading-state');

// Elementos do perfil
const profileNome = document.getElementById('profileNome');
const profileEmail = document.getElementById('profileEmail');
const profileTipo = document.getElementById('profileTipo');
const profileId = document.getElementById('profileId');
const profileAvatar = document.getElementById('profileAvatar');
const btnEditar = document.getElementById('btnEditarPerfil');
const listaBibliotecas = document.getElementById('listaBibliotecas');

// FUNÇÕES DO MENU OFF-CANVAS
function abrirMenu() {
    offcanvasMenu.classList.add('active');
    overlay.classList.add('active');
    menuLigar.classList.add('active');
}

function fecharMenu() {
    offcanvasMenu.classList.remove('active');
    overlay.classList.remove('active');
    menuLigar.classList.remove('active');
}

if (menuLigar) {
    menuLigar.addEventListener('click', (e) => {
        e.stopPropagation();
        offcanvasMenu.classList.contains('active') ? fecharMenu() : abrirMenu();
    });
}

if (overlay) {
    overlay.addEventListener('click', fecharMenu);
}

document.querySelectorAll('.menu-items a').forEach(link => {
    link.addEventListener('click', fecharMenu);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && offcanvasMenu?.classList.contains('active')) {
        fecharMenu();
    }
});

// FUNÇÃO DE LOADER
function setLoading(isLoading) {
    if (loadingState) {
        loadingState.style.display = isLoading ? 'flex' : 'none';
    }
}

// FUNÇÃO PARA CARREGAR BIBLIOTECAS DO USUÁRIO
async function carregarBibliotecasDoUsuario(uid) {
    if (!listaBibliotecas) return;
    try {
        const bibliotecasRef = ref(db, `users/${uid}/bibliotecas`);
        const snapshot = await get(bibliotecasRef);
        if (snapshot.exists()) {
            const bibliotecas = snapshot.val();
            const ids = Object.keys(bibliotecas);
            if (ids.length === 0) {
                listaBibliotecas.innerHTML = '<li>Nenhuma biblioteca associada.</li>';
                return;
            }
            let html = '';
            for (const id of ids) {
                // Busca o nome da biblioteca (opcional)
                const biblioSnap = await get(ref(db, `bibliotecas/biblioCadastradas/${id}`));
                const nome = biblioSnap.exists() ? biblioSnap.val().nome || id : id;
                html += `<li><i class="fa fa-university"></i> ${nome} (ID: ${id})</li>`;
            }
            listaBibliotecas.innerHTML = html;
        } else {
            listaBibliotecas.innerHTML = '<li>Nenhuma biblioteca associada.</li>';
        }
    } catch (error) {
        console.error("Erro ao carregar bibliotecas do usuário:", error);
        listaBibliotecas.innerHTML = '<li>Erro ao carregar bibliotecas.</li>';
    }
}

// FUNÇÃO PARA ATUALIZAR INTERFACE
async function updateUI(user) {
    console.log("updateUI executando. user:", user);
    setLoading(false);

    if (user) {
        // Usuário logado
        loginItems.forEach(el => { if (el) el.style.display = 'none'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'block'; });
        if (logoutItem) logoutItem.style.display = 'block';
        if (loggedContent) loggedContent.style.display = 'block';
        if (blockedMessage) blockedMessage.style.display = 'none';

        // Atualizar cabeçalho do menu
        if (userNameEl) userNameEl.textContent = "Carregando...";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "...";

        // Buscar dados do usuário no RTDB
        try {
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log("Dados do usuário:", data);

                // Cabeçalho do menu
                if (userNameEl) userNameEl.textContent = data.nome || data.idEstudante || "Usuário";
                if (userEmailEl) userEmailEl.textContent = user.email;
                if (userTypeEl) {
                    if (data.tipo === 'estudante') userTypeEl.textContent = "Estudante";
                    else if (data.tipo === 'leitor') userTypeEl.textContent = "Leitor";
                    else userTypeEl.textContent = "Usuário";
                }

                // Preencher perfil
                if (profileNome) profileNome.textContent = data.nome || data.idEstudante || "Não informado";
                if (profileEmail) profileEmail.textContent = user.email;
                if (profileTipo) {
                    profileTipo.textContent = 
                        data.tipo === 'estudante' ? "Estudante" :
                        data.tipo === 'leitor' ? "Leitor" : "Usuário";
                }
                if (profileId) profileId.textContent = data.idEstudante || data.cpf || "Não informado";
                if (profileAvatar && data.avatar) profileAvatar.src = data.avatar;

                // Carregar bibliotecas do usuário
                await carregarBibliotecasDoUsuario(user.uid);
            } else {
                // Fallback
                if (userNameEl) userNameEl.textContent = "Usuário";
                if (userEmailEl) userEmailEl.textContent = user.email;
                if (userTypeEl) userTypeEl.textContent = "Usuário";
                if (profileNome) profileNome.textContent = "Usuário";
                if (profileEmail) profileEmail.textContent = user.email;
                if (profileTipo) profileTipo.textContent = "Usuário";
                if (profileId) profileId.textContent = "Não informado";
                if (listaBibliotecas) listaBibliotecas.innerHTML = '<li>Nenhuma biblioteca associada.</li>';
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
        }
    } else {
        // Usuário não logado
        loginItems.forEach(el => { if (el) el.style.display = 'block'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'none'; });
        if (logoutItem) logoutItem.style.display = 'none';
        if (loggedContent) loggedContent.style.display = 'none';
        if (blockedMessage) blockedMessage.style.display = 'flex';

        // Placeholder
        if (userNameEl) userNameEl.textContent = "Visitante";
        if (userEmailEl) userEmailEl.textContent = "Faça login para acessar";
        if (userTypeEl) userTypeEl.textContent = "Não logado";
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
        signOut(auth)
            .then(() => {
                console.log("Logout bem-sucedido");
            })
            .catch(err => console.error("Erro no logout:", err));
    });
}

// BOTÃO EDITAR PERFIL
if (btnEditar) {
    btnEditar.addEventListener('click', () => {
        window.location.href = 'Configurations.html'; // ajuste conforme necessário
    });
}

// INICIALIZAÇÃO
setLoading(true);