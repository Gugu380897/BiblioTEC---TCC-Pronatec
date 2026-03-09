// JS/Alugueis_Auth.js
import { auth, db } from "./Firebase_Auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Alugueis_Auth.js carregado");

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
const emprestimosContainer = document.getElementById('emprestimos-container');

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

// FUNÇÃO PARA MOSTRAR ESTADO VAZIO
function mostrarVazio(mensagem = 'Nenhum aluguel atual') {
    if (!emprestimosContainer) return;
    emprestimosContainer.innerHTML = `
        <div class="empty-state">
            <i class="fa fa-book-open" style="font-size: 64px; color: #667eea;"></i>
            <h2>${mensagem}</h2>
            <p>Você ainda não possui livros alugados no momento.</p>
            <a href="home.html" class="btn-explorar">Explorar livros</a>
        </div>
    `;
}

// FUNÇÃO PARA CARREGAR EMPRÉSTIMOS ATIVOS
async function carregarEmprestimosAtivos(uid) {
    if (!emprestimosContainer) return;
    try {
        const emprestimosRef = ref(db, `users/${uid}/emprestimos`);
        const snapshot = await get(emprestimosRef);
        
        if (!snapshot.exists()) {
            mostrarVazio();
            return;
        }

        const emprestimos = [];
        snapshot.forEach(child => {
            emprestimos.push({ id: child.key, ...child.val() });
        });

        // Filtrar apenas os ativos
        const ativos = emprestimos.filter(emp => emp.status === 'ativo');

        if (ativos.length === 0) {
            mostrarVazio();
            return;
        }

        // Ordenar por data de empréstimo (mais recentes primeiro)
        ativos.sort((a, b) => new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo));

        const hoje = new Date();
        let html = '';

        ativos.forEach(emp => {
            // Formatar datas
            const dataEmprestimo = emp.dataEmprestimo ? new Date(emp.dataEmprestimo).toLocaleDateString() : 'N/A';
            const dataPrevista = emp.dataPrevistaDevolucao ? new Date(emp.dataPrevistaDevolucao).toLocaleDateString() : 'N/A';
            
            // Verificar atraso
            const dataPrev = emp.dataPrevistaDevolucao ? new Date(emp.dataPrevistaDevolucao) : null;
            const atrasado = dataPrev ? hoje > dataPrev : false;
            const statusClass = atrasado ? 'atrasado' : '';
            const statusText = atrasado ? 'Atrasado' : 'Em dia';

            html += `
                <div class="emprestimo-card">
                    <img src="${emp.capa || 'https://via.placeholder.com/80x100?text=Sem+Capa'}" alt="Capa">
                    <div class="emprestimo-info">
                        <h3>${emp.titulo || 'Livro'}</h3>
                        <p><strong>Autor:</strong> ${emp.autor || 'Desconhecido'}</p>
                        <p><strong>Empréstimo:</strong> ${dataEmprestimo}</p>
                        <p><strong>Devolução prevista:</strong> ${dataPrevista}</p>
                        <span class="emprestimo-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });

        emprestimosContainer.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar empréstimos:", error);
        mostrarVazio('Erro ao carregar dados.');
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

        try {
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log("Dados do usuário:", data);

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

        // Carregar empréstimos ativos
        await carregarEmprestimosAtivos(user.uid);
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

// INICIALIZAÇÃO
setLoading(true);