// JS/Profile_Bibliotecario_Auth.js
import { auth, db } from "./Firebase_Auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Profile_Bibliotecario_Auth.js carregado");

// ELEMENTOS DO DOM
const menuLigar = document.getElementById('menuLigar');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');
const userNameEl = document.querySelector('.user-name');
const userEmailEl = document.querySelector('.user-email');
const userTypeEl = document.querySelector('.user-type');
const logoutItem = document.querySelector('.logout');
const loginItems = document.querySelectorAll('.login');
const userMenuItems = document.querySelectorAll('.menu-items li:not(.logout):not(.login)');
const loggedContent = document.getElementById('logged-content');
const blockedMessage = document.getElementById('blocked-message');
const loadingState = document.getElementById('loading-state');
const profileAvatar = document.getElementById('profileAvatar');
const profileNome = document.getElementById('profileNome');
const profileEmail = document.getElementById('profileEmail');
const profileIdBiblioteca = document.getElementById('profileIdBiblioteca');
const profileNomeBiblioteca = document.getElementById('profileNomeBiblioteca');
const profileIdBibliotecarioNum = document.getElementById('profileIdBibliotecarioNum');
const btnEditar = document.getElementById('btnEditarPerfil');

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
    link.addEventListener('click', (e) => {
        if (link.getAttribute('href') !== '#') {
            fecharMenu();
        }
    });
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
    } else {
        console.warn('Elemento loadingState não encontrado');
    }
}

// Fallback: esconder loading após 5 segundos caso algo dê errado
setTimeout(() => {
    setLoading(false);
}, 5000);

// FUNÇÃO PARA CARREGAR DADOS DO BIBLIOTECÁRIO
async function carregarDadosBibliotecario(user) {
    try {
        // Buscar dados no nó "bibliotecarios"
        const biblioRef = ref(db, `bibliotecarios/${user.uid}`);
        const biblioSnapshot = await get(biblioRef);
        
        if (!biblioSnapshot.exists()) {
            console.warn("Bibliotecário não encontrado no nó 'bibliotecarios'.");
            // Se não for bibliotecário, talvez redirecionar
            signOut(auth);
            mostrarMensagem("Usuário não autorizado.", "erro");
            return;
        }

        const data = biblioSnapshot.val();
        console.log("Dados do bibliotecário:", data);

        // Atualizar cabeçalho do menu
        if (userNameEl) userNameEl.textContent = data.nome || "Bibliotecário";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "Bibliotecário";

        // Atualizar informações do perfil
        if (profileNome) profileNome.textContent = data.nome || "Não informado";
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileIdBiblioteca) profileIdBiblioteca.textContent = data.idBiblioteca || "N/A";

        // Buscar nome da biblioteca (opcional)
        if (data.idBiblioteca) {
            const bibliotecaRef = ref(db, `bibliotecas/biblioCadastradas/${data.idBiblioteca}`);
            const bibliotecaSnap = await get(bibliotecaRef);
            if (bibliotecaSnap.exists()) {
                const bibliotecaData = bibliotecaSnap.val();
                if (profileNomeBiblioteca) profileNomeBiblioteca.textContent = bibliotecaData.nome || data.idBiblioteca;
            } else {
                if (profileNomeBiblioteca) profileNomeBiblioteca.textContent = data.idBiblioteca;
            }
        } else {
            if (profileNomeBiblioteca) profileNomeBiblioteca.textContent = "N/A";
        }

        // Número do bibliotecário (se existir)
        if (profileIdBibliotecarioNum) {
            profileIdBibliotecarioNum.textContent = data.idBibliotecarioNum || data.idBibliotecario || "Não informado";
        }

        // Avatar (se tiver)
        if (data.avatar && profileAvatar) {
            profileAvatar.src = data.avatar;
        }

    } catch (error) {
        console.error("Erro ao carregar dados do bibliotecário:", error);
        mostrarMensagem("Erro ao carregar dados.", "erro");
    }
}

// FUNÇÃO PARA ATUALIZAR INTERFACE
async function updateUI(user) {
    console.log("updateUI executando. user:", user);
    setLoading(false);

    if (user) {
        // Verificar se o usuário está no nó "bibliotecarios" (já faremos no carregamento)
        loginItems.forEach(el => { if (el) el.style.display = 'none'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'block'; });
        if (logoutItem) logoutItem.style.display = 'block';
        if (loggedContent) loggedContent.style.display = 'block';
        if (blockedMessage) blockedMessage.style.display = 'none';

        // Atualizar cabeçalho do menu com placeholder
        if (userNameEl) userNameEl.textContent = "Carregando...";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "...";

        // Carregar dados do bibliotecário
        await carregarDadosBibliotecario(user);
    } else {
        // Usuário não logado
        loginItems.forEach(el => { if (el) el.style.display = 'block'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'none'; });
        if (logoutItem) logoutItem.style.display = 'none';
        if (loggedContent) loggedContent.style.display = 'none';
        if (blockedMessage) blockedMessage.style.display = 'flex';

        if (userNameEl) userNameEl.textContent = "Visitante";
        if (userEmailEl) userEmailEl.textContent = "Faça login para acessar";
        if (userTypeEl) userTypeEl.textContent = "Não logado";
    }
}

// DESTACAR ITEM ATIVO NO MENU
function destacarItemAtivo() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.menu-items a').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.closest('li').classList.add('active');
        }
    });
}

// OBSERVADOR DE AUTENTICAÇÃO
auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged disparado:", user);
    updateUI(user);
    destacarItemAtivo();
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
        window.location.href = 'Configurations_Bibliotecario.html';
    });
}

// FUNÇÃO AUXILIAR PARA MENSAGENS (opcional)
function mostrarMensagem(texto, tipo = 'sucesso') {
    let msgDiv = document.getElementById('mensagemGlobal');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'mensagemGlobal';
        msgDiv.className = 'cadMensagem';
        document.body.appendChild(msgDiv);
    }
    msgDiv.textContent = texto;
    msgDiv.className = `cadMensagem ${tipo}`;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3500);
}

// INICIALIZAÇÃO
setLoading(true);