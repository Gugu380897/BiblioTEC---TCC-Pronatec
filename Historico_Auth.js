// JS/Historico_Auth.js
import { auth, db } from "./Firebase_Auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Historico_Auth.js carregado");

// ELEMENTOS DO DOM
const menuLigar = document.getElementById('menuLigar');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');
const userNameEl = document.querySelector('.user-name');
const userEmailEl = document.querySelector('.user-email');
const userTypeEl = document.querySelector('.user-type');
const logoutItem = document.querySelector('.logout');
const loginItems = document.querySelectorAll('.login');
const userMenuItems = document.querySelectorAll('.menu-items li:not(.logout):not(.login)'); // itens do usuário
const loggedContent = document.getElementById('logged-content');
const blockedMessage = document.getElementById('blocked-message');
const loadingState = document.getElementById('loading-state');
const historicoContainer = document.getElementById('historicoContainer');

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

// Destacar item ativo no menu
function destacarItemAtivo() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.menu-items a').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.closest('li').classList.add('active');
        }
    });
}

// FUNÇÃO DE LOADER
function setLoading(isLoading) {
    if (loadingState) {
        loadingState.style.display = isLoading ? 'flex' : 'none';
    }
}

// FUNÇÃO PARA CARREGAR EMPRÉSTIMOS REAIS
async function carregarEmprestimos(uid) {
    if (!historicoContainer) return;
    try {
        const emprestimosRef = ref(db, `users/${uid}/emprestimos`);
        const snapshot = await get(emprestimosRef);

        if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
            historicoContainer.innerHTML = `
                <div class="historico-vazio">
                    <i class="fa fa-book"></i>
                    <p>Você ainda não realizou nenhum empréstimo.</p>
                </div>
            `;
            return;
        }

        const emprestimos = [];
        snapshot.forEach(child => {
            emprestimos.push({ id: child.key, ...child.val() });
        });

        // Ordenar por data de empréstimo (mais recente primeiro)
        emprestimos.sort((a, b) => new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo));

        let html = '';
        emprestimos.forEach(emp => {
            // Formatar datas
            const dataEmprestimo = emp.dataEmprestimo ? new Date(emp.dataEmprestimo).toLocaleDateString() : 'N/A';
            const dataDevolucao = emp.dataDevolucaoReal ? new Date(emp.dataDevolucaoReal).toLocaleDateString() : 
                                 (emp.dataPrevistaDevolucao ? new Date(emp.dataPrevistaDevolucao).toLocaleDateString() : 'N/A');

            // Determinar status
            let statusClass = '';
            let statusText = '';
            if (emp.status === 'ativo') {
                const hoje = new Date();
                const dataPrev = new Date(emp.dataPrevistaDevolucao);
                if (hoje > dataPrev) {
                    statusClass = 'atrasado';
                    statusText = 'Atrasado';
                } else {
                    statusClass = 'pendente';
                    statusText = 'Em andamento';
                }
            } else if (emp.status === 'devolvido') {
                statusClass = 'devolvido';
                statusText = 'Devolvido';
            } else if (emp.status === 'devolvido com atraso') {
                statusClass = 'atrasado';
                statusText = 'Devolvido com atraso';
            } else {
                statusClass = 'pendente';
                statusText = emp.status || 'Desconhecido';
            }

            // Buscar capa do livro? Se não tiver, placeholder
            const capa = emp.capa || 'https://via.placeholder.com/150x200?text=Sem+Capa';

            html += `
                <div class="emprestimo-card">
                    <img src="${capa}" alt="Capa do livro">
                    <div class="emprestimo-info">
                        <h3>${emp.titulo || 'Título não informado'}</h3>
                        <p class="autor">${emp.autor || 'Autor desconhecido'}</p>
                        <div class="emprestimo-detalhes">
                            <span><i class="fa fa-calendar"></i> Empréstimo: ${dataEmprestimo}</span>
                            <span><i class="fa fa-calendar-check-o"></i> Devolução: ${dataDevolucao}</span>
                        </div>
                        <span class="emprestimo-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        historicoContainer.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        historicoContainer.innerHTML = '<p class="historico-vazio">Erro ao carregar histórico.</p>';
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

        // Buscar dados do usuário no RTDB (para nome e tipo)
        try {
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (userNameEl) userNameEl.textContent = data.nome || data.idEstudante || "Usuário";
                if (userEmailEl) userEmailEl.textContent = user.email;
                if (userTypeEl) {
                    if (data.tipo === 'estudante') userTypeEl.textContent = "Estudante";
                    else if (data.tipo === 'leitor') userTypeEl.textContent = "Leitor";
                    else userTypeEl.textContent = "Usuário";
                }
            } else {
                if (userNameEl) userNameEl.textContent = "Usuário";
                if (userEmailEl) userEmailEl.textContent = user.email;
                if (userTypeEl) userTypeEl.textContent = "Usuário";
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
        }

        // Carregar empréstimos
        await carregarEmprestimos(user.uid);
        destacarItemAtivo(); // destaca o item do menu
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

// INICIALIZAÇÃO
setLoading(true);