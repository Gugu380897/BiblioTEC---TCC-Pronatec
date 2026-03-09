//  IMPORTS 
import { auth, db } from "./Firebase_Auth.js";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get, update, remove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Config.js carregado");

//  ELEMENTOS DO DOM 
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

// Elementos dos formulários
const formPerfil = document.getElementById('formPerfil');
const formConta = document.getElementById('formConta');
const formPrivacidade = document.getElementById('formPrivacidade');
const formNotificacoes = document.getElementById('formNotificacoes');
const formSeguranca = document.getElementById('formSeguranca');
const btnExcluirConta = document.getElementById('excluirConta');
const btnExportarDados = document.getElementById('exportarDados');

// Elementos da sidebar de abas
const sidebarItems = document.querySelectorAll('.settings-sidebar li');
const tabPanes = document.querySelectorAll('.tab-pane');

//  FUNÇÕES DO MENU OFF-CANVAS 
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
        // Fecha o menu apenas se for um link real (não o logout com href="#")
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

//  DESTACAR ITEM ATIVO NO MENU 
const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.menu-items a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
        link.closest('li').classList.add('active');
    }
});

//  FUNÇÃO DE LOADER 
function setLoading(isLoading) {
    if (loadingState) {
        loadingState.style.display = isLoading ? 'flex' : 'none';
    }
}

//  FUNÇÃO DE MENSAGEM (usando a classe .cadMensagem do CSS) 
function mostrarMensagem(texto, tipo = 'sucesso') {
    let msgDiv = document.getElementById('mensagemGlobal');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'mensagemGlobal';
        msgDiv.className = 'cadMensagem'; // usa a classe definida no CSS
        document.body.appendChild(msgDiv);
    }
    msgDiv.textContent = texto;
    msgDiv.className = `cadMensagem ${tipo}`;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3500);
}

//  FUNÇÃO PARA OBTER NOME DO TIPO 
function getTipoDisplay(tipo) {
    const tipos = {
        estudante: 'Estudante',
        leitor: 'Leitor',
        bibliotecario: 'Bibliotecário'
    };
    return tipos[tipo] || tipo;
}

//  CARREGAR DADOS DO USUÁRIO 
async function carregarDadosUsuario(user) {
    try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("Dados do usuário carregados:", data);

            // Atualizar cabeçalho do menu
            if (userNameEl) userNameEl.textContent = data.nome || data.idEstudante || "Usuário";
            if (userEmailEl) userEmailEl.textContent = user.email;
            if (userTypeEl) userTypeEl.textContent = getTipoDisplay(data.tipo);

            // Preencher formulário de perfil
            const profileNome = document.getElementById('profileNome');
            const profileEmail = document.getElementById('profileEmail');
            const profileTipo = document.getElementById('profileTipo');
            const profileId = document.getElementById('profileId');
            if (profileNome) profileNome.value = data.nome || '';
            if (profileEmail) profileEmail.value = user.email;
            if (profileTipo) profileTipo.value = getTipoDisplay(data.tipo);
            if (profileId) profileId.value = data.idEstudante || data.cpf || '';

            // Preencher formulário de conta
            const contaUsername = document.getElementById('contaUsername');
            const contaEmailRec = document.getElementById('contaEmailRecuperacao');
            const contaTelefone = document.getElementById('contaTelefone');
            if (contaUsername) contaUsername.value = data.username || '';
            if (contaEmailRec) contaEmailRec.value = data.emailRecuperacao || '';
            if (contaTelefone) contaTelefone.value = data.telefone || '';

            // Preencher checkboxes de privacidade
            const privacidadeCompartilhar = document.getElementById('privacidadeCompartilhar');
            const privacidadeHistorico = document.getElementById('privacidadeHistorico');
            const privacidadeRecomendacoes = document.getElementById('privacidadeRecomendacoes');
            if (privacidadeCompartilhar) privacidadeCompartilhar.checked = data.compartilharDados || false;
            if (privacidadeHistorico) privacidadeHistorico.checked = data.historicoVisivel || false;
            if (privacidadeRecomendacoes) privacidadeRecomendacoes.checked = data.recomendacoes || false;

            // Preencher checkboxes de notificações
            const notifEmail = document.getElementById('notifEmail');
            const notifLembretes = document.getElementById('notifLembretes');
            const notifNovidades = document.getElementById('notifNovidades');
            const notifReservas = document.getElementById('notifReservas');
            if (notifEmail) notifEmail.checked = data.notifEmail || false;
            if (notifLembretes) notifLembretes.checked = data.notifLembretes || false;
            if (notifNovidades) notifNovidades.checked = data.notifNovidades || false;
            if (notifReservas) notifReservas.checked = data.notifReservas || false;

            // Preencher campo de dois fatores (apenas visual)
            const segurancaDoisFatores = document.getElementById('segurancaDoisFatores');
            if (segurancaDoisFatores) segurancaDoisFatores.checked = data.doisFatores || false;

        } else {
            console.warn("Documento do usuário não encontrado.");
        }
    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        mostrarMensagem("Erro ao carregar dados.", "erro");
    }
}

//  ATUALIZAR INTERFACE 
async function updateUI(user) {
    setLoading(false);

    if (user) {
        loginItems.forEach(el => { if (el) el.style.display = 'none'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'block'; });
        if (logoutItem) logoutItem.style.display = 'block';
        if (loggedContent) loggedContent.style.display = 'block';
        if (blockedMessage) blockedMessage.style.display = 'none';

        // Placeholder enquanto carrega
        if (userNameEl) userNameEl.textContent = "Carregando...";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "...";

        await carregarDadosUsuario(user);
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

//  OBSERVADOR DE AUTENTICAÇÃO 
auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged:", user);
    updateUI(user);
});

//  LOGOUT 
if (logoutItem) {
    logoutItem.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth)
            .then(() => console.log("Logout efetuado"))
            .catch(err => console.error("Erro no logout:", err));
    });
}

//  TABS 
sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        sidebarItems.forEach(i => i.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

//  SALVAR FORMULÁRIOS 

// Perfil
if (formPerfil) {
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const nome = document.getElementById('profileNome').value.trim();
        // O email não pode ser alterado diretamente (requer verificação), ignoramos.
        const foto = document.getElementById('profileFoto').files[0];
        // Por enquanto, apenas atualiza nome no RTDB
        try {
            await update(ref(db, `users/${user.uid}`), { nome });
            mostrarMensagem('Perfil atualizado com sucesso!', 'sucesso');
            carregarDadosUsuario(user);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            mostrarMensagem('Erro ao atualizar perfil.', 'erro');
        }
    });
}

// Conta
if (formConta) {
    formConta.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const username = document.getElementById('contaUsername').value.trim();
        const emailRec = document.getElementById('contaEmailRecuperacao').value.trim();
        const telefone = document.getElementById('contaTelefone').value.trim();
        try {
            await update(ref(db, `users/${user.uid}`), {
                username,
                emailRecuperacao: emailRec,
                telefone
            });
            mostrarMensagem('Dados da conta atualizados!', 'sucesso');
        } catch (error) {
            console.error('Erro ao atualizar conta:', error);
            mostrarMensagem('Erro ao atualizar conta.', 'erro');
        }
    });
}

// Privacidade
if (formPrivacidade) {
    formPrivacidade.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const compartilhar = document.getElementById('privacidadeCompartilhar').checked;
        const historico = document.getElementById('privacidadeHistorico').checked;
        const recomendacoes = document.getElementById('privacidadeRecomendacoes').checked;
        try {
            await update(ref(db, `users/${user.uid}`), {
                compartilharDados: compartilhar,
                historicoVisivel: historico,
                recomendacoes
            });
            mostrarMensagem('Preferências de privacidade salvas!', 'sucesso');
        } catch (error) {
            console.error('Erro ao salvar privacidade:', error);
            mostrarMensagem('Erro ao salvar.', 'erro');
        }
    });
}

// Notificações
if (formNotificacoes) {
    formNotificacoes.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const notifEmail = document.getElementById('notifEmail').checked;
        const notifLembretes = document.getElementById('notifLembretes').checked;
        const notifNovidades = document.getElementById('notifNovidades').checked;
        const notifReservas = document.getElementById('notifReservas').checked;
        try {
            await update(ref(db, `users/${user.uid}`), {
                notifEmail,
                notifLembretes,
                notifNovidades,
                notifReservas
            });
            mostrarMensagem('Preferências de notificação salvas!', 'sucesso');
        } catch (error) {
            console.error('Erro ao salvar notificações:', error);
            mostrarMensagem('Erro ao salvar.', 'erro');
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
            // Reautenticar usuário
            const credential = EmailAuthProvider.credential(user.email, senhaAtual);
            await reauthenticateWithCredential(user, credential);
            // Atualizar senha
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

//  EXCLUIR CONTA 
if (btnExcluirConta) {
    btnExcluirConta.addEventListener('click', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const confirmacao = confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão removidos.");
        if (!confirmacao) return;

        // Solicitar senha novamente (reautenticação)
        const senha = prompt("Digite sua senha para confirmar a exclusão:");
        if (!senha) return;

        try {
            const credential = EmailAuthProvider.credential(user.email, senha);
            await reauthenticateWithCredential(user, credential);

            // Remover dados do RTDB
            await remove(ref(db, `users/${user.uid}`));

            // Excluir usuário do Auth
            await deleteUser(user);

            mostrarMensagem('Conta excluída com sucesso.', 'sucesso');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            if (error.code === 'auth/wrong-password') {
                mostrarMensagem('Senha incorreta.', 'erro');
            } else {
                mostrarMensagem('Erro ao excluir conta.', 'erro');
            }
        }
    });
}

//  EXPORTAR DADOS 
if (btnExportarDados) {
    btnExportarDados.addEventListener('click', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const dados = snapshot.val();
                const dadosStr = JSON.stringify(dados, null, 2);
                const blob = new Blob([dadosStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meus_dados_${user.uid}.json`;
                a.click();
                URL.revokeObjectURL(url);
                mostrarMensagem('Exportação iniciada.', 'sucesso');
            } else {
                mostrarMensagem('Nenhum dado encontrado.', 'aviso');
            }
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            mostrarMensagem('Erro ao exportar dados.', 'erro');
        }
    });
}

//  INICIALIZAÇÃO 
setLoading(true);