import { auth, db } from "./Firebase_Auth.js";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Config_Bibliotecario.js carregado");

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

// Formulários
const formPerfil = document.getElementById('formPerfil');
const formBiblioteca = document.getElementById('formBiblioteca');
const formSeguranca = document.getElementById('formSeguranca');

// Sidebar e abas
const sidebarItems = document.querySelectorAll('.settings-sidebar li');
const tabPanes = document.querySelectorAll('.tab-pane');

let bibliotecaId = null; // ID do documento da biblioteca
let idBibliotecaNum = null; // número IDBiblioteca

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
    }
}

// FUNÇÃO DE MENSAGEM
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

// CARREGAR DADOS DO BIBLIOTECÁRIO
async function carregarDados(user) {
    try {
        // Dados do bibliotecário
        const biblioRef = ref(db, `bibliotecarios/${user.uid}`);
        const biblioSnap = await get(biblioRef);
        if (!biblioSnap.exists()) {
            console.warn("Bibliotecário não encontrado.");
            return;
        }
        const biblioData = biblioSnap.val();
        console.log("Dados do bibliotecário:", biblioData);

        // Atualizar cabeçalho
        if (userNameEl) userNameEl.textContent = biblioData.nome || "Bibliotecário";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "Bibliotecário";

        // Preencher formulário de perfil
        const profileNome = document.getElementById('profileNome');
        const profileEmail = document.getElementById('profileEmail');
        if (profileNome) profileNome.value = biblioData.nome || '';
        if (profileEmail) profileEmail.value = user.email;

        // ID da biblioteca
        bibliotecaId = biblioData.idBiblioteca;
        idBibliotecaNum = biblioData.idBibliotecarioNum; // se existir

        // Buscar dados da biblioteca
        if (bibliotecaId) {
            const bibRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}`);
            const bibSnap = await get(bibRef);
            if (bibSnap.exists()) {
                const bibData = bibSnap.val();
                document.getElementById('bibliotecaNome').value = bibData.nome || '';
                document.getElementById('bibliotecaEndereco').value = bibData.endereco || '';
                document.getElementById('bibliotecaTelefone').value = bibData.telefone || '';
                document.getElementById('bibliotecaId').value = bibliotecaId;
                document.getElementById('bibliotecaNum').value = bibData.IDBiblioteca || '';
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        mostrarMensagem("Erro ao carregar dados.", "erro");
    }
}

// ATUALIZAR INTERFACE
async function updateUI(user) {
    setLoading(false);

    if (user) {
        loginItems.forEach(el => { if (el) el.style.display = 'none'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'block'; });
        if (logoutItem) logoutItem.style.display = 'block';
        if (loggedContent) loggedContent.style.display = 'block';
        if (blockedMessage) blockedMessage.style.display = 'none';

        // Placeholder
        if (userNameEl) userNameEl.textContent = "Carregando...";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "...";

        await carregarDados(user);
    } else {
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

// DESTACAR ITEM ATIVO
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
    console.log("onAuthStateChanged:", user);
    updateUI(user);
    destacarItemAtivo();
});

// LOGOUT
if (logoutItem) {
    logoutItem.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth)
            .then(() => console.log("Logout efetuado"))
            .catch(err => console.error("Erro no logout:", err));
    });
}

// TABS
sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        sidebarItems.forEach(i => i.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// SALVAR FORMULÁRIOS

// Perfil
if (formPerfil) {
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const nome = document.getElementById('profileNome').value.trim();
        try {
            await update(ref(db, `bibliotecarios/${user.uid}`), { nome });
            mostrarMensagem('Perfil atualizado!', 'sucesso');
            carregarDados(user);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            mostrarMensagem('Erro ao atualizar.', 'erro');
        }
    });
}

// Biblioteca
if (formBiblioteca) {
    formBiblioteca.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!bibliotecaId) {
            mostrarMensagem('Biblioteca não identificada.', 'erro');
            return;
        }
        const nome = document.getElementById('bibliotecaNome').value.trim();
        const endereco = document.getElementById('bibliotecaEndereco').value.trim();
        const telefone = document.getElementById('bibliotecaTelefone').value.trim();
        try {
            await update(ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}`), {
                nome,
                endereco,
                telefone
            });
            mostrarMensagem('Dados da biblioteca atualizados!', 'sucesso');
        } catch (error) {
            console.error('Erro ao atualizar biblioteca:', error);
            mostrarMensagem('Erro ao atualizar.', 'erro');
        }
    });
}

// Segurança (alterar senha)
if (formSeguranca) {
    formSeguranca.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const senhaAtual = document.getElementById('segurancaSenhaAtual').value;
        const novaSenha = document.getElementById('segurancaNovaSenha').value;
        const confirmarSenha = document.getElementById('segurancaConfirmarSenha').value;

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            mostrarMensagem('Preencha todos os campos de senha.', 'erro');
            return;
        }
        if (novaSenha !== confirmarSenha) {
            mostrarMensagem('As novas senhas não coincidem.', 'erro');
            return;
        }
        if (novaSenha.length < 6) {
            mostrarMensagem('A nova senha deve ter pelo menos 6 caracteres.', 'erro');
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, senhaAtual);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, novaSenha);
            mostrarMensagem('Senha alterada com sucesso!', 'sucesso');
            formSeguranca.reset();
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            if (error.code === 'auth/wrong-password') {
                mostrarMensagem('Senha atual incorreta.', 'erro');
            } else {
                mostrarMensagem('Erro ao alterar senha.', 'erro');
            }
        }
    });
}

// INICIALIZAÇÃO
setLoading(true);