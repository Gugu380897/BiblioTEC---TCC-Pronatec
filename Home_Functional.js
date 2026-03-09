// IMPORTS
import { db } from "./Firebase_Auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

// MENU OFF-CANVAS
const menuLigar = document.getElementById('menuLigar');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');

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

menuLigar.addEventListener('click', (e) => {
    e.stopPropagation();
    offcanvasMenu.classList.contains('active') ? fecharMenu() : abrirMenu();
});

overlay.addEventListener('click', fecharMenu);

document.querySelectorAll('.menu-items a').forEach(link => {
    link.addEventListener('click', fecharMenu);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && offcanvasMenu.classList.contains('active')) {
        fecharMenu();
    }
});

// VARIÁVEIS GLOBAIS
const bibliotecaSelect = document.getElementById('bibliotecaAtual');
const nomeBibliotecaSpan = document.getElementById('nomeBibliotecaAtual');
const livrosContainer = document.getElementById('livrosContainer');
const btnAdicionarAcesso = document.getElementById('btnAdicionarAcesso');
const modal = document.getElementById('modalAdicionarAcesso');
const closeModal = modal?.querySelector('.close');
const formAdicionarAcesso = document.getElementById('formAdicionarAcesso');
const pesquisaInput = document.getElementById('pesquisaInput');
const btnPesquisar = document.getElementById('btnPesquisar');

let bibliotecaAtualId = null;
let livrosCache = [];
let termoPesquisa = ''; // termo atual da pesquisa

// Obtém o UID do usuário logado (deve estar no localStorage)
const userUID = localStorage.getItem('user_UID');

// FUNÇÕES DOS FILTROS
const mapaGeneros = {
    'ficcao': 'Ficção',
    'ficcao-cientifica': 'Ficção Científica',
    'romance': 'Romance',
    'tecnico': 'Técnico',
    'aventura': 'Aventura',
    'biografia': 'Biografia',
    'terror': 'Terror',
    'infantil': 'Infantil'
};

const botaoFiltragem = document.getElementById('botaoFiltragem');
const painelFiltros = document.getElementById('painelFiltros');
const fecharFiltros = document.querySelector('.fechar-filtros');
const limparFiltros = document.querySelector('.limpar-filtros');
const aplicarFiltragem = document.querySelector('.aplicar-filtros');
const filtrarAno = document.getElementById('filtrarAno');
const valorAno = document.getElementById('valorAno');
const badge = document.querySelector('.badgeF');

function getCategoriasSelecionadas() {
    const checkboxes = document.querySelectorAll('.categoria-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function countActiveFilters() {
    let count = document.querySelectorAll('.categoria-checkbox:checked').length;
    if (filtrarAno.value != 2026) count++;
    if (document.getElementById('filtroDisponivel').checked) count++;
    if (document.getElementById('filtroRecente').checked) count++;
    if (document.getElementById('filtroPopular').checked) count++;
    return count;
}

function getActiveFilters() {
    return {
        categorias: getCategoriasSelecionadas(),
        ano: parseInt(filtrarAno.value),
        disponivel: document.getElementById('filtroDisponivel').checked,
        recente: document.getElementById('filtroRecente').checked,
        popular: document.getElementById('filtroPopular').checked
    };
}

function atualizarBadge() {
    const count = countActiveFilters();
    badge.textContent = count;
    badge.style.display = count === 0 ? 'none' : 'flex';
}

filtrarAno.addEventListener('input', function() {
    valorAno.textContent = this.value;
    atualizarBadge();
    aplicarFiltrosEPesquisa();
});

botaoFiltragem.addEventListener('click', (e) => {
    e.stopPropagation();
    painelFiltros.classList.toggle('active');
});

fecharFiltros.addEventListener('click', () => {
    painelFiltros.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!botaoFiltragem.contains(e.target) && !painelFiltros.contains(e.target)) {
        painelFiltros.classList.remove('active');
    }
});

document.querySelectorAll('.categoria-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
        atualizarBadge();
        aplicarFiltrosEPesquisa();
    });
});
document.getElementById('filtroDisponivel').addEventListener('change', () => {
    atualizarBadge();
    aplicarFiltrosEPesquisa();
});
document.getElementById('filtroRecente').addEventListener('change', () => {
    atualizarBadge();
    aplicarFiltrosEPesquisa();
});
document.getElementById('filtroPopular').addEventListener('change', () => {
    atualizarBadge();
    aplicarFiltrosEPesquisa();
});

limparFiltros.addEventListener('click', () => {
    document.querySelectorAll('.categoria-checkbox').forEach(cb => cb.checked = false);
    filtrarAno.value = 2026;
    valorAno.textContent = 2026;
    document.getElementById('filtroDisponivel').checked = false;
    document.getElementById('filtroRecente').checked = false;
    document.getElementById('filtroPopular').checked = false;
    atualizarBadge();
    aplicarFiltrosEPesquisa();
});

aplicarFiltragem.addEventListener('click', () => {
    painelFiltros.classList.remove('active');
});

// FUNÇÕES DE FILTRAGEM DE LIVROS
function filtrarLivros(livros, filtros) {
    let resultados = [...livros];
    if (filtros.categorias.length > 0) {
        const generosSelecionados = filtros.categorias
            .map(val => mapaGeneros[val])
            .filter(g => g !== undefined);
        if (generosSelecionados.length > 0) {
            resultados = resultados.filter(livro => generosSelecionados.includes(livro.genero));
        }
    }
    if (filtros.ano < 2026) {
        resultados = resultados.filter(livro => livro.ano <= filtros.ano);
    }
    if (filtros.disponivel) {
        resultados = resultados.filter(livro => livro.status === 'disponível'); // atenção: no banco pode ser "disponível"
    }
    if (filtros.recente) {
        resultados.sort((a, b) => b.ano - a.ano);
    }
    if (filtros.popular) {
        resultados.sort((a, b) => (b.quantidade || 0) - (a.quantidade || 0));
    }
    return resultados;
}

// Função para aplicar filtro de pesquisa por título
function pesquisarLivros(livros, termo) {
    if (!termo) return livros;
    return livros.filter(livro => 
        livro.titulo.toLowerCase().includes(termo.toLowerCase())
    );
}

// Função combinada que aplica pesquisa e filtros
function aplicarFiltrosEPesquisa() {
    const filtros = getActiveFilters();
    let livrosFiltrados = filtrarLivros(livrosCache, filtros);
    livrosFiltrados = pesquisarLivros(livrosFiltrados, termoPesquisa);
    renderizarLivros(livrosFiltrados);
}

// Evento de pesquisa
btnPesquisar.addEventListener('click', () => {
    termoPesquisa = pesquisaInput.value.trim();
    aplicarFiltrosEPesquisa();
});

pesquisaInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        termoPesquisa = pesquisaInput.value.trim();
        aplicarFiltrosEPesquisa();
    }
});

function renderizarLivros(lista) {
    livrosContainer.innerHTML = '';
    if (lista.length === 0) {
        livrosContainer.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum livro encontrado.</p>';
        return;
    }
    lista.forEach(livro => {
        const disponivel = livro.quantidadeDisponivel !== undefined ? livro.quantidadeDisponivel : (livro.quantidade - (livro.quantidadeAlugada || 0));
        const status = livro.status || (disponivel > 0 ? 'disponível' : 'indisponível');
        const card = document.createElement('div');
        card.className = 'livro-card';
        card.innerHTML = `
            <img src="${livro.capa || 'https://via.placeholder.com/150x200?text=Sem+Capa'}" alt="Capa">
            <div class="livro-info">
                <h3>${livro.titulo}</h3>
                <p class="autor">${livro.autor}</p>
                <div class="detalhes">
                    <span class="genero">📖 ${livro.genero}</span>
                    <span class="status ${status}">${status === 'disponível' ? '🟢 Disponível' : '🔴 Indisponível'}</span>
                    <span class="quantidade">📦 Disponível: ${disponivel}</span>
                </div>
            </div>
        `;
        livrosContainer.appendChild(card);
    });
}

// FUNÇÕES DE DADOS (RTDB)
// Carrega as bibliotecas que o usuário tem acesso (salvas em /users/{uid}/bibliotecas)
async function carregarBibliotecasDoUsuario() {
    if (!userUID) return;
    try {
        const snapshot = await get(ref(db, `users/${userUID}/bibliotecas`));
        bibliotecaSelect.innerHTML = '<option value="">Selecione uma biblioteca</option>';
        if (snapshot.exists()) {
            const bibliotecas = snapshot.val();
            for (const [bibliotecaId, dados] of Object.entries(bibliotecas)) {
                // Busca o nome da biblioteca na coleção de bibliotecas
                const biblioSnap = await get(ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}`));
                const nome = biblioSnap.exists() ? biblioSnap.val().nome || bibliotecaId : bibliotecaId;
                const option = document.createElement('option');
                option.value = bibliotecaId;
                option.textContent = nome;
                bibliotecaSelect.appendChild(option);
            }
        } else {
            bibliotecaSelect.innerHTML = '<option value="">Nenhuma biblioteca associada</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar bibliotecas do usuário:', error);
    }
}

async function carregarLivrosDaBiblioteca(bibliotecaId) {
    try {
        const snapshot = await get(ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros`));
        if (snapshot.exists()) {
            const livros = [];
            snapshot.forEach(child => {
                livros.push({ id: child.key, ...child.val() });
            });
            return livros;
        }
        return [];
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        return [];
    }
}

async function atualizarBibliotecaELista() {
    if (!bibliotecaAtualId) {
        nomeBibliotecaSpan.innerHTML = 'Selecione uma biblioteca <span></span>';
        livrosContainer.innerHTML = '';
        return;
    }
    const biblioSnap = await get(ref(db, `bibliotecas/biblioCadastradas/${bibliotecaAtualId}`));
    const nome = biblioSnap.exists() ? biblioSnap.val().nome || bibliotecaAtualId : bibliotecaAtualId;
    nomeBibliotecaSpan.innerHTML = `${nome} <span>(você está aqui)</span>`;

    livrosCache = await carregarLivrosDaBiblioteca(bibliotecaAtualId);
    // Reseta o termo de pesquisa e aplica filtros
    termoPesquisa = '';
    pesquisaInput.value = '';
    aplicarFiltrosEPesquisa();
}

// EVENTOS
bibliotecaSelect.addEventListener('change', (e) => {
    bibliotecaAtualId = e.target.value;
    atualizarBibliotecaELista();
});

// Botão para adicionar acesso a uma nova biblioteca
if (btnAdicionarAcesso) {
    btnAdicionarAcesso.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Adicionar acesso via ID numérico da biblioteca (IDBiblioteca)
formAdicionarAcesso.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idBibliotecaNum = parseInt(document.getElementById('bibliotecaIdInput').value.trim(), 10);

    if (isNaN(idBibliotecaNum)) {
        mostrarMensagem('Digite um número válido.', 'erro');
        return;
    }

    // Busca todas as bibliotecas
    const bibliotecasRef = ref(db, 'bibliotecas/biblioCadastradas');
    const snapshot = await get(bibliotecasRef);

    if (!snapshot.exists()) {
        mostrarMensagem('Nenhuma biblioteca cadastrada.', 'erro');
        return;
    }

    // Procura a biblioteca que possui o IDBiblioteca igual ao informado
    let bibliotecaEncontrada = null;
    snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.IDBiblioteca === idBibliotecaNum) {
            bibliotecaEncontrada = {
                id: childSnapshot.key,
                nome: data.nome || childSnapshot.key
            };
        }
    });

    if (!bibliotecaEncontrada) {
        mostrarMensagem('Biblioteca não encontrada com esse ID.', 'erro');
        return;
    }

    // Adiciona o ID da biblioteca ao nó do usuário
    if (!userUID) {
        mostrarMensagem('Usuário não identificado.', 'erro');
        return;
    }

    const userBibliotecasRef = ref(db, `users/${userUID}/bibliotecas/${bibliotecaEncontrada.id}`);
    await set(userBibliotecasRef, { acessadoEm: new Date().toISOString() });

    mostrarMensagem(`Acesso adicionado à biblioteca "${bibliotecaEncontrada.nome}"!`, 'sucesso');
    modal.style.display = 'none';
    formAdicionarAcesso.reset();
    await carregarBibliotecasDoUsuario(); // recarrega o select
});

// Função auxiliar para mensagens
function mostrarMensagem(texto, tipo) {
    let msgDiv = document.getElementById('mensagemHome');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'mensagemHome';
        msgDiv.className = 'cadMensagem';
        document.body.appendChild(msgDiv);
    }
    msgDiv.textContent = texto;
    msgDiv.className = `cadMensagem ${tipo}`;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3000);
}

// INICIALIZAÇÃO
if (userUID) {
    carregarBibliotecasDoUsuario();
} else {
    console.warn('Usuário não logado. As bibliotecas não serão carregadas.');
}
atualizarBadge();