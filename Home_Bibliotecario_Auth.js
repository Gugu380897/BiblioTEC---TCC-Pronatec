import { auth, db } from "./Firebase_Auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get, push, set, update, runTransaction, remove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

console.log("Home_Bibliotecario.js carregado");

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
const biblioNomeSpan = document.getElementById('biblioNome');
const nomeBibliotecaSpan = document.getElementById('nomeBibliotecaAtual');
const idBibliotecaSpan = document.getElementById('idBiblioteca');
const livrosContainer = document.getElementById('livrosContainer');

// Modais
const modalCadastro = document.getElementById('modalCadastroLivro');
const closeCadastroModal = document.querySelector('#modalCadastroLivro .close-modal');
const formCadastro = document.getElementById('formCadastroLivroModal');

const modalEdicao = document.getElementById('modalEditarLivro');
const closeEdicaoModal = document.getElementById('closeEditarModal');
const formEdicao = document.getElementById('formEditarLivro');
const btnDeletar = document.getElementById('btnDeletarLivro');

const modalEmprestimo = document.getElementById('modalRegistrarEmprestimo');
const closeEmprestimoModal = document.getElementById('closeEmprestimoModal');
const formEmprestimo = document.getElementById('formRegistrarEmprestimo');
const btnCancelarEmprestimo = document.getElementById('btnCancelarEmprestimo');

const modalDevolucao = document.getElementById('modalDevolucao');
const closeDevolucaoModal = document.getElementById('closeDevolucaoModal');
const formDevolucao = document.getElementById('formDevolucao');
const btnCancelarDevolucao = document.getElementById('btnCancelarDevolucao');

const modalListar = document.getElementById('modalListarEmprestimos');
const closeListarModal = document.getElementById('closeListarModal');
const btnFecharListar = document.getElementById('btnFecharListar');
const tbody = document.getElementById('tbodyEmprestimos');

let bibliotecaId = null;
let livroAtualFirebaseKey = null;
let livroAtualIdNumerico = null;

// MENU OFF-CANVAS
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

// UTILITÁRIOS
function setLoading(isLoading) {
    if (loadingState) {
        loadingState.style.display = isLoading ? 'flex' : 'none';
    }
}

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

// LIVROS
async function carregarLivros() {
    if (!bibliotecaId) {
        livrosContainer.innerHTML = '<p style="text-align:center;">Biblioteca não identificada.</p>';
        return;
    }
    try {
        const livrosRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros`);
        const snapshot = await get(livrosRef);

        if (snapshot.exists()) {
            const livros = [];
            snapshot.forEach(child => {
                livros.push({ firebaseKey: child.key, ...child.val() });
            });
            renderizarLivros(livros);
        } else {
            livrosContainer.innerHTML = '<p style="text-align:center;">Nenhum livro cadastrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        livrosContainer.innerHTML = '<p style="text-align:center;">Erro ao carregar livros.</p>';
    }
}

function renderizarLivros(lista) {
    livrosContainer.innerHTML = '';
    if (lista.length === 0) {
        livrosContainer.innerHTML = '<p style="text-align:center;">Nenhum livro cadastrado.</p>';
        return;
    }

    lista.forEach(livro => {
        const disponivel = livro.quantidadeDisponivel !== undefined 
            ? livro.quantidadeDisponivel 
            : (livro.quantidade - (livro.quantidadeAlugada || 0));

        const card = document.createElement('div');
        card.className = 'livro-card';
        card.innerHTML = `
            <img src="${livro.capa || 'https://via.placeholder.com/150x200?text=Sem+Capa'}" alt="Capa">
            <div class="livro-info">
                <h3>
                    <span class="livro-id-badge">ID:${livro.idNumerico || '???'}</span>
                    ${livro.titulo || 'Sem título'}
                    <span class="livro-edit-icon" data-key="${livro.firebaseKey}" data-id="${livro.idNumerico}">
                        <i class="fa fa-cog"></i>
                    </span>
                </h3>
                <p class="autor">${livro.autor || 'Autor desconhecido'}</p>
                <div class="detalhes">
                    <span class="genero">📖 ${livro.genero || 'Gênero não informado'}</span>
                    <span class="status ${livro.status || 'disponível'}">
                        ${livro.status === 'disponível' ? '🟢 Disponível' : '🔴 Indisponível'}
                    </span>
                    <span class="quantidade">📦 Disponível: ${disponivel}</span>
                </div>
            </div>
        `;
        livrosContainer.appendChild(card);
    });

    // Adicionar eventos às engrenagens
    document.querySelectorAll('.livro-edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const firebaseKey = icon.dataset.key;
            const idNumerico = icon.dataset.id;
            abrirModalEdicao(firebaseKey, idNumerico);
        });
    });
}

// CADASTRO DE LIVRO
async function gerarProximoIdLivro() {
    if (!bibliotecaId) throw new Error("Biblioteca não identificada");
    const contadorRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/proximoIdLivro`);
    let novoId;
    await runTransaction(contadorRef, (currentValue) => {
        if (currentValue === null) {
            novoId = 1;
            return 2;
        } else {
            novoId = currentValue;
            return currentValue + 1;
        }
    });
    return novoId;
}

async function cadastrarLivro(event) {
    event.preventDefault();

    const titulo = document.getElementById('modalTituloLivro').value.trim();
    const autor = document.getElementById('modalAutorLivro').value.trim();
    const genero = document.getElementById('modalGeneroLivro').value.trim();
    const ano = parseInt(document.getElementById('modalAnoPublicacao').value, 10);
    const quantidadeTotal = parseInt(document.getElementById('modalQuantidadeTotal').value, 10);
    const capaUrl = document.getElementById('modalCapaUrl').value.trim() || '';

    if (!titulo || !autor || !genero || !ano || !quantidadeTotal) {
        mostrarMensagem('Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    const quantidadeAlugada = 0;
    const quantidadeDisponivel = quantidadeTotal - quantidadeAlugada;
    const status = quantidadeDisponivel > 0 ? 'disponível' : 'indisponível';

    try {
        const idNumerico = await gerarProximoIdLivro();

        const novoLivro = {
            idNumerico,
            ano,
            autor,
            genero,
            quantidade: quantidadeTotal,
            quantidadeAlugada,
            quantidadeDisponivel,
            status,
            titulo,
            capa: capaUrl,
            createdAt: new Date().toISOString()
        };

        const livrosRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros`);
        const novoLivroRef = push(livrosRef);
        await set(novoLivroRef, novoLivro);

        mostrarMensagem(`Livro "${titulo}" cadastrado com sucesso! ID: ${idNumerico}`, 'sucesso');
        modalCadastro.style.display = 'none';
        formCadastro.reset();
        carregarLivros();
    } catch (error) {
        console.error('Erro ao cadastrar livro:', error);
        mostrarMensagem('Erro ao cadastrar livro: ' + error.message, 'erro');
    }
}

// EMPRÉSTIMO
async function carregarUsuariosSelect() {
    const selectUsuario = document.getElementById('emprestimoUsuario');
    if (!selectUsuario) return;
    if (!bibliotecaId) {
        selectUsuario.innerHTML = '<option value="">Biblioteca não identificada</option>';
        return;
    }
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        selectUsuario.innerHTML = '<option value="">Selecione um usuário</option>';
        if (snapshot.exists()) {
            let count = 0;
            snapshot.forEach(child => {
                const data = child.val();
                if (data.bibliotecas && data.bibliotecas[bibliotecaId]) {
                    const nome = data.nome || data.idEstudante || 'Usuário';
                    const idNumerico = data.idNumerico;
                    if (idNumerico) {
                        const option = document.createElement('option');
                        option.value = idNumerico;
                        option.textContent = `${nome} (ID: ${idNumerico})`;
                        selectUsuario.appendChild(option);
                        count++;
                    }
                }
            });
            if (count === 0) {
                selectUsuario.innerHTML = '<option value="">Nenhum usuário com acesso</option>';
            }
        } else {
            selectUsuario.innerHTML = '<option value="">Nenhum usuário encontrado</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        selectUsuario.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function carregarLivrosSelect() {
    const selectLivro = document.getElementById('emprestimoLivro');
    if (!selectLivro || !bibliotecaId) return;
    try {
        const livrosRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros`);
        const snapshot = await get(livrosRef);
        if (snapshot.exists()) {
            selectLivro.innerHTML = '<option value="">Selecione um livro</option>';
            snapshot.forEach(child => {
                const data = child.val();
                if (data.quantidadeDisponivel > 0) {
                    const option = document.createElement('option');
                    option.value = data.idNumerico;
                    option.textContent = `${data.titulo} (ID: ${data.idNumerico}) - Disponível: ${data.quantidadeDisponivel}`;
                    selectLivro.appendChild(option);
                }
            });
        } else {
            selectLivro.innerHTML = '<option value="">Nenhum livro disponível</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        selectLivro.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

document.getElementById('btnRegistrarEmprestimo')?.addEventListener('click', () => {
    if (!bibliotecaId) {
        mostrarMensagem("Biblioteca não identificada.", "erro");
        return;
    }
    carregarUsuariosSelect();
    carregarLivrosSelect();
    modalEmprestimo.style.display = 'flex';
});

formEmprestimo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idUsuario = parseInt(document.getElementById('emprestimoUsuario').value, 10);
    const idLivro = parseInt(document.getElementById('emprestimoLivro').value, 10);
    const dataDevolucaoStr = document.getElementById('emprestimoDataDevolucao').value;

    if (isNaN(idUsuario) || isNaN(idLivro) || !dataDevolucaoStr) {
        mostrarMensagem('Selecione um usuário, um livro e a data de devolução.', 'erro');
        return;
    }

    const dataPrevista = new Date(dataDevolucaoStr).toISOString();

    try {
        const usuariosRef = ref(db, 'users');
        const usuariosSnapshot = await get(usuariosRef);
        let usuarioUid = null;
        let usuarioEncontrado = null;
        usuariosSnapshot.forEach(child => {
            const data = child.val();
            if (data.idNumerico === idUsuario) {
                usuarioEncontrado = data;
                usuarioUid = child.key;
            }
        });

        if (!usuarioEncontrado) {
            mostrarMensagem('Usuário não encontrado.', 'erro');
            return;
        }

        const livrosRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros`);
        const livrosSnapshot = await get(livrosRef);
        let livroEncontrado = null;
        let livroFirebaseKey = null;
        livrosSnapshot.forEach(child => {
            const data = child.val();
            if (data.idNumerico === idLivro) {
                livroEncontrado = data;
                livroFirebaseKey = child.key;
            }
        });

        if (!livroEncontrado) {
            mostrarMensagem('Livro não encontrado nesta biblioteca.', 'erro');
            return;
        }

        if (livroEncontrado.quantidadeDisponivel <= 0) {
            mostrarMensagem('Livro indisponível para empréstimo.', 'erro');
            return;
        }

        const emprestimoRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/emprestimos`);
        const novoEmprestimoRef = push(emprestimoRef);
        const emprestimoData = {
            idUsuario,
            idLivro,
            dataEmprestimo: new Date().toISOString(),
            dataPrevistaDevolucao: dataPrevista,
            status: 'ativo',
            uidUsuario: usuarioUid,
            firebaseKeyLivro: livroFirebaseKey,
            tituloLivro: livroEncontrado.titulo,
            nomeUsuario: usuarioEncontrado.nome || usuarioEncontrado.idEstudante || 'Usuário'
        };
        await set(novoEmprestimoRef, emprestimoData);

        // Atualizar o livro: quantidadeAlugada, quantidadeDisponivel e status
        const livroRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros/${livroFirebaseKey}`);
        const novaQtdAlugada = (livroEncontrado.quantidadeAlugada || 0) + 1;
        const novaQtdDisponivel = (livroEncontrado.quantidadeDisponivel || livroEncontrado.quantidade) - 1;
        const novoStatusLivro = novaQtdDisponivel > 0 ? 'disponível' : 'indisponível';

        await update(livroRef, {
            quantidadeAlugada: novaQtdAlugada,
            quantidadeDisponivel: novaQtdDisponivel,
            status: novoStatusLivro
        });

        console.log(`Livro atualizado: novaQtdDisponivel=${novaQtdDisponivel}, status=${novoStatusLivro}`);

        const historicoUsuarioRef = ref(db, `users/${usuarioUid}/emprestimos/${novoEmprestimoRef.key}`);
        await set(historicoUsuarioRef, {
            idLivro,
            titulo: livroEncontrado.titulo,
            dataEmprestimo: new Date().toISOString(),
            dataPrevistaDevolucao: dataPrevista,
            status: 'ativo',
            bibliotecaId
        });

        mostrarMensagem('Empréstimo registrado com sucesso!', 'sucesso');
        modalEmprestimo.style.display = 'none';
        formEmprestimo.reset();
        carregarLivros(); // recarrega a lista
    } catch (error) {
        console.error('Erro ao registrar empréstimo:', error);
        mostrarMensagem('Erro ao registrar empréstimo: ' + error.message, 'erro');
    }
});

// DEVOLUÇÃO (CORRIGIDA)

async function carregarUsuariosDevolucaoSelect() {
    const selectUsuario = document.getElementById('devolucaoUsuario');
    if (!selectUsuario) return;
    if (!bibliotecaId) {
        selectUsuario.innerHTML = '<option value="">Biblioteca não identificada</option>';
        return;
    }
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        selectUsuario.innerHTML = '<option value="">Selecione um usuário</option>';
        if (snapshot.exists()) {
            let count = 0;
            snapshot.forEach(child => {
                const data = child.val();
                if (data.bibliotecas && data.bibliotecas[bibliotecaId]) {
                    const nome = data.nome || data.idEstudante || 'Usuário';
                    const idNumerico = data.idNumerico;
                    if (idNumerico) {
                        const option = document.createElement('option');
                        option.value = idNumerico;
                        option.dataset.uid = child.key;
                        option.textContent = `${nome} (ID: ${idNumerico})`;
                        selectUsuario.appendChild(option);
                        count++;
                    }
                }
            });
            if (count === 0) {
                selectUsuario.innerHTML = '<option value="">Nenhum usuário com acesso</option>';
            }
        } else {
            selectUsuario.innerHTML = '<option value="">Nenhum usuário encontrado</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        selectUsuario.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

async function carregarEmprestimosDoUsuario(uidUsuario) {
    const selectEmprestimo = document.getElementById('devolucaoEmprestimo');
    if (!selectEmprestimo) return;
    selectEmprestimo.innerHTML = '<option value="">Carregando...</option>';
    try {
        const emprestimosRef = ref(db, `users/${uidUsuario}/emprestimos`);
        const snapshot = await get(emprestimosRef);
        selectEmprestimo.innerHTML = '<option value="">Selecione um empréstimo</option>';
        if (snapshot.exists()) {
            let count = 0;
            snapshot.forEach(child => {
                const data = child.val();
                if (data.status === 'ativo') {
                    count++;
                    const option = document.createElement('option');
                    option.value = child.key;
                    option.textContent = `Livro: ${data.titulo} (ID: ${data.idLivro}) - Empréstimo: ${new Date(data.dataEmprestimo).toLocaleDateString()}`;
                    selectEmprestimo.appendChild(option);
                }
            });
            if (count === 0) {
                selectEmprestimo.innerHTML = '<option value="">Nenhum empréstimo ativo</option>';
            }
        } else {
            selectEmprestimo.innerHTML = '<option value="">Nenhum empréstimo ativo</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        selectEmprestimo.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

document.getElementById('btnRegistrarDevolucao')?.addEventListener('click', () => {
    if (!bibliotecaId) {
        mostrarMensagem("Biblioteca não identificada.", "erro");
        return;
    }
    carregarUsuariosDevolucaoSelect();
    const selectEmprestimo = document.getElementById('devolucaoEmprestimo');
    if (selectEmprestimo) selectEmprestimo.innerHTML = '<option value="">Selecione um usuário primeiro</option>';
    modalDevolucao.style.display = 'flex';
});

document.getElementById('devolucaoUsuario')?.addEventListener('change', (e) => {
    const selectedOption = e.target.selectedOptions[0];
    if (selectedOption && selectedOption.dataset.uid) {
        carregarEmprestimosDoUsuario(selectedOption.dataset.uid);
    } else {
        const selectEmprestimo = document.getElementById('devolucaoEmprestimo');
        if (selectEmprestimo) selectEmprestimo.innerHTML = '<option value="">Selecione um usuário primeiro</option>';
    }
});

formDevolucao.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emprestimoKey = document.getElementById('devolucaoEmprestimo').value;
    if (!emprestimoKey) {
        mostrarMensagem('Selecione um empréstimo.', 'erro');
        return;
    }

    try {
        const usuarioUid = document.getElementById('devolucaoUsuario').selectedOptions[0]?.dataset.uid;
        if (!usuarioUid) {
            mostrarMensagem('Usuário não selecionado.', 'erro');
            return;
        }

        console.log("Devolução iniciada. emprestimoKey:", emprestimoKey, "usuarioUid:", usuarioUid, "bibliotecaId:", bibliotecaId);

        const emprestimoUsuarioRef = ref(db, `users/${usuarioUid}/emprestimos/${emprestimoKey}`);
        const emprestimoUsuarioSnap = await get(emprestimoUsuarioRef);
        if (!emprestimoUsuarioSnap.exists()) {
            mostrarMensagem('Empréstimo não encontrado.', 'erro');
            return;
        }
        const emprestimoData = emprestimoUsuarioSnap.val();
        if (emprestimoData.status !== 'ativo') {
            mostrarMensagem('Este empréstimo já foi devolvido.', 'erro');
            return;
        }

        const dataDevolucaoReal = new Date().toISOString();
        const dataPrevista = new Date(emprestimoData.dataPrevistaDevolucao);
        const hoje = new Date();
        const atrasado = hoje > dataPrevista;
        const novoStatus = atrasado ? 'devolvido com atraso' : 'devolvido';

        // Atualizar empréstimo no usuário
        await update(emprestimoUsuarioRef, {
            status: novoStatus,
            dataDevolucaoReal: dataDevolucaoReal
        });

        // Atualizar empréstimo na biblioteca (se existir)
        if (emprestimoData.bibliotecaId === bibliotecaId) {
            const emprestimoBiblioRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/emprestimos/${emprestimoKey}`);
            await update(emprestimoBiblioRef, {
                status: novoStatus,
                dataDevolucaoReal: dataDevolucaoReal
            });
        }

        // Atualizar o livro
        const livroRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros/${emprestimoData.firebaseKeyLivro}`);
        const livroSnap = await get(livroRef);
        if (!livroSnap.exists()) {
            console.error("Livro não encontrado no banco:", emprestimoData.firebaseKeyLivro);
            mostrarMensagem('Livro associado não encontrado.', 'erro');
            return;
        }

        const livro = livroSnap.val();
        console.log("Livro antes da devolução:", livro);

        const novaQtdAlugada = (livro.quantidadeAlugada || 0) - 1;
        const novaQtdDisponivel = (livro.quantidadeDisponivel || livro.quantidade) + 1;
        const novoStatusLivro = novaQtdDisponivel > 0 ? 'disponível' : 'indisponível';

        console.log("novaQtdAlugada:", novaQtdAlugada, "novaQtdDisponivel:", novaQtdDisponivel, "novoStatusLivro:", novoStatusLivro);

        await update(livroRef, {
            quantidadeAlugada: novaQtdAlugada >= 0 ? novaQtdAlugada : 0,
            quantidadeDisponivel: novaQtdDisponivel,
            status: novoStatusLivro
        });

        mostrarMensagem(`Devolução registrada com sucesso! Status: ${novoStatus}`, 'sucesso');
        modalDevolucao.style.display = 'none';
        formDevolucao.reset();
        carregarLivros(); // recarrega a lista de livros
    } catch (error) {
        console.error('Erro ao registrar devolução:', error);
        mostrarMensagem('Erro ao registrar devolução: ' + error.message, 'erro');
    }
});

// LISTAGEM DE EMPRÉSTIMOS E DEVOLUÇÕES
const btnVerAtivos = document.getElementById('btnVerAtivos');
const btnVerDevolucoes = document.getElementById('btnVerDevolucoes');

// Função para carregar empréstimos ativos (ajustada para mostrar data prevista)
async function carregarEmprestimosAtivos() {
    if (!bibliotecaId) return;
    try {
        const emprestimosRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/emprestimos`);
        const snapshot = await get(emprestimosRef);
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            let temAtivos = false;
            const hoje = new Date();
            snapshot.forEach(child => {
                const data = child.val();
                if (data.status === 'ativo') {
                    temAtivos = true;
                    const dataEmprestimo = new Date(data.dataEmprestimo).toLocaleDateString();
                    const dataPrevista = new Date(data.dataPrevistaDevolucao).toLocaleDateString();
                    const dataPrevistaObj = new Date(data.dataPrevistaDevolucao);
                    const atrasado = hoje > dataPrevistaObj;
                    const statusTexto = atrasado ? 'Atrasado' : 'Em dia';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.nomeUsuario || 'N/A'}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.tituloLivro || 'N/A'}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dataEmprestimo}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Prevista: ${dataPrevista}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${atrasado ? '#dc3545' : '#28a745'};">${statusTexto}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">
                            <button class="btn-deletar-emprestimo" data-key="${child.key}" data-uid="${data.uidUsuario}" data-livrokey="${data.firebaseKeyLivro}" style="background: none; border: none; color: #dc3545; cursor: pointer;" title="Deletar empréstimo">
                                <i class="fa fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                }
            });
            if (!temAtivos) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum empréstimo ativo no momento.</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum empréstimo ativo no momento.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Erro ao carregar.</td></tr>';
    }
}

// Função para carregar devoluções
async function carregarDevolucoes() {
    if (!bibliotecaId) return;
    try {
        const emprestimosRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/emprestimos`);
        const snapshot = await get(emprestimosRef);
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            let temDevolvidos = false;
            snapshot.forEach(child => {
                const data = child.val();
                if (data.status && data.status.startsWith('devolvido')) { // 'devolvido' ou 'devolvido com atraso'
                    temDevolvidos = true;
                    const dataEmprestimo = new Date(data.dataEmprestimo).toLocaleDateString();
                    const dataDevolucaoReal = data.dataDevolucaoReal ? new Date(data.dataDevolucaoReal).toLocaleDateString() : 'N/A';
                    const statusTexto = data.status === 'devolvido' ? 'Devolvido' : 'Devolvido com atraso';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.nomeUsuario || 'N/A'}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.tituloLivro || 'N/A'}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dataEmprestimo}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dataDevolucaoReal}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${data.status === 'devolvido' ? '#28a745' : '#dc3545'};">${statusTexto}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">-</td>
                    `;
                    tbody.appendChild(row);
                }
            });
            if (!temDevolvidos) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma devolução registrada.</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhuma devolução registrada.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar devoluções:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Erro ao carregar.</td></tr>';
    }
}

// Event listeners dos botões de seleção
btnVerAtivos.addEventListener('click', () => {
    btnVerAtivos.classList.add('active');
    btnVerDevolucoes.classList.remove('active');
    carregarEmprestimosAtivos();
});

btnVerDevolucoes.addEventListener('click', () => {
    btnVerDevolucoes.classList.add('active');
    btnVerAtivos.classList.remove('active');
    carregarDevolucoes();
});

// Ao abrir o modal, carregar ativos por padrão
document.getElementById('btnListarEmprestimos')?.addEventListener('click', () => {
    if (!bibliotecaId) {
        mostrarMensagem("Biblioteca não identificada.", "erro");
        return;
    }
    btnVerAtivos.classList.add('active');
    btnVerDevolucoes.classList.remove('active');
    carregarEmprestimosAtivos();
    modalListar.style.display = 'flex';
});

// Função para deletar empréstimo (já existente, mantenha)
async function deletarEmprestimo(emprestimoKey, usuarioUid, firebaseKeyLivro) {
    if (!confirm('Tem certeza que deseja deletar este empréstimo? O livro será devolvido ao acervo.')) return;

    try {
        const usuarioRef = ref(db, `users/${usuarioUid}/emprestimos/${emprestimoKey}`);
        await remove(usuarioRef);

        const bibliotecaRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/emprestimos/${emprestimoKey}`);
        await remove(bibliotecaRef);

        const livroRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros/${firebaseKeyLivro}`);
        const livroSnap = await get(livroRef);
        if (livroSnap.exists()) {
            const livro = livroSnap.val();
            const novaQtdAlugada = (livro.quantidadeAlugada || 0) - 1;
            const novaQtdDisponivel = (livro.quantidadeDisponivel || livro.quantidade) + 1;
            const novoStatusLivro = novaQtdDisponivel > 0 ? 'disponível' : 'indisponível';
            await update(livroRef, {
                quantidadeAlugada: novaQtdAlugada >= 0 ? novaQtdAlugada : 0,
                quantidadeDisponivel: novaQtdDisponivel,
                status: novoStatusLivro
            });
        }

        mostrarMensagem('Empréstimo deletado com sucesso!', 'sucesso');
        // Recarregar a lista atual (ativos ou devoluções)
        if (btnVerAtivos.classList.contains('active')) {
            carregarEmprestimosAtivos();
        } else {
            carregarDevolucoes();
        }
        carregarLivros();
    } catch (error) {
        console.error('Erro ao deletar empréstimo:', error);
        mostrarMensagem('Erro ao deletar empréstimo.', 'erro');
    }
}

document.getElementById('btnListarEmprestimos')?.addEventListener('click', () => {
    if (!bibliotecaId) {
        mostrarMensagem("Biblioteca não identificada.", "erro");
        return;
    }
    carregarEmprestimosAtivos();
    modalListar.style.display = 'flex';
});

if (closeListarModal) {
    closeListarModal.addEventListener('click', () => modalListar.style.display = 'none');
}
if (btnFecharListar) {
    btnFecharListar.addEventListener('click', () => modalListar.style.display = 'none');
}

// EDIÇÃO DE LIVRO

async function abrirModalEdicao(firebaseKey, idNumerico) {
    if (!bibliotecaId) return;
    livroAtualFirebaseKey = firebaseKey;
    livroAtualIdNumerico = idNumerico;
    try {
        const livroRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros/${firebaseKey}`);
        const snapshot = await get(livroRef);
        if (snapshot.exists()) {
            const livro = snapshot.val();
            document.getElementById('editarLivroId').value = idNumerico;
            document.getElementById('editarLivroKey').value = firebaseKey;
            document.getElementById('editarTitulo').value = livro.titulo || '';
            document.getElementById('editarAutor').value = livro.autor || '';
            document.getElementById('editarGenero').value = livro.genero || '';
            document.getElementById('editarAno').value = livro.ano || '';
            document.getElementById('editarQuantidade').value = livro.quantidade || '';
            document.getElementById('editarCapa').value = livro.capa || '';
            modalEdicao.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao carregar livro para edição:', error);
        mostrarMensagem('Erro ao carregar dados do livro.', 'erro');
    }
}

async function editarLivro(event) {
    event.preventDefault();

    const firebaseKey = document.getElementById('editarLivroKey').value;
    const titulo = document.getElementById('editarTitulo').value.trim();
    const autor = document.getElementById('editarAutor').value.trim();
    const genero = document.getElementById('editarGenero').value.trim();
    const ano = parseInt(document.getElementById('editarAno').value, 10);
    const quantidadeTotal = parseInt(document.getElementById('editarQuantidade').value, 10);
    const capaUrl = document.getElementById('editarCapa').value.trim() || '';

    if (!titulo || !autor || !genero || !ano || !quantidadeTotal) {
        mostrarMensagem('Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    try {
        const livroRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros/${firebaseKey}`);
        const snapshot = await get(livroRef);
        if (!snapshot.exists()) {
            mostrarMensagem('Livro não encontrado.', 'erro');
            return;
        }
        const livroAtual = snapshot.val();
        const quantidadeAlugada = livroAtual.quantidadeAlugada || 0;
        const quantidadeDisponivel = quantidadeTotal - quantidadeAlugada;
        const status = quantidadeDisponivel > 0 ? 'disponível' : 'indisponível';

        const atualizacoes = {
            titulo,
            autor,
            genero,
            ano,
            quantidade: quantidadeTotal,
            quantidadeDisponivel,
            status,
            capa: capaUrl,
            updatedAt: new Date().toISOString()
        };

        await update(livroRef, atualizacoes);
        mostrarMensagem('Livro atualizado com sucesso!', 'sucesso');
        modalEdicao.style.display = 'none';
        carregarLivros();
    } catch (error) {
        console.error('Erro ao editar livro:', error);
        mostrarMensagem('Erro ao editar livro: ' + error.message, 'erro');
    }
}

// DELETAR LIVRO
if (btnDeletar) {
    btnDeletar.addEventListener('click', async () => {
        if (!livroAtualFirebaseKey || !bibliotecaId) return;
        if (!confirm(`Tem certeza que deseja deletar o livro #${livroAtualIdNumerico}?`)) return;

        try {
            const livroRef = ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/livros/${livroAtualFirebaseKey}`);
            await set(livroRef, null);
            mostrarMensagem('Livro deletado com sucesso!', 'sucesso');
            modalEdicao.style.display = 'none';
            carregarLivros();
        } catch (error) {
            console.error('Erro ao deletar livro:', error);
            mostrarMensagem('Erro ao deletar livro.', 'erro');
        }
    });
}

// INTERFACE
async function updateUI(user) {
    console.log("updateUI executando. user:", user);
    setLoading(false);

    if (user) {
        loginItems.forEach(el => { if (el) el.style.display = 'none'; });
        userMenuItems.forEach(el => { if (el) el.style.display = 'block'; });
        if (logoutItem) logoutItem.style.display = 'block';
        if (loggedContent) loggedContent.style.display = 'block';
        if (blockedMessage) blockedMessage.style.display = 'none';

        if (userNameEl) userNameEl.textContent = "Carregando...";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (userTypeEl) userTypeEl.textContent = "...";

        try {
            const biblioRef = ref(db, `bibliotecarios/${user.uid}`);
            const snapshot = await get(biblioRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (biblioNomeSpan) biblioNomeSpan.textContent = data.nome || "Bibliotecário";
                if (userNameEl) userNameEl.textContent = data.nome || "Bibliotecário";
                if (userEmailEl) userEmailEl.textContent = user.email;
                if (userTypeEl) userTypeEl.textContent = "Bibliotecário";

                bibliotecaId = data.idBiblioteca;
                if (idBibliotecaSpan) idBibliotecaSpan.textContent = bibliotecaId || "N/A";

                if (bibliotecaId) {
                    const biblioSnap = await get(ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}`));
                    if (biblioSnap.exists()) {
                        const biblioData = biblioSnap.val();
                        if (nomeBibliotecaSpan) nomeBibliotecaSpan.textContent = biblioData.nome || bibliotecaId;
                    } else {
                        if (nomeBibliotecaSpan) nomeBibliotecaSpan.textContent = bibliotecaId;
                    }
                }
                carregarLivros();
            } else {
                console.warn("Bibliotecário não encontrado.");
                await signOut(auth);
                mostrarMensagem("Usuário não autorizado.", "erro");
            }
        } catch (error) {
            console.error("Erro:", error);
        }
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

// EVENTOS
auth.onAuthStateChanged((user) => {
    console.log("onAuthStateChanged:", user);
    updateUI(user);
});

if (logoutItem) {
    logoutItem.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => console.log("Logout efetuado")).catch(err => console.error(err));
    });
}

document.getElementById('btnAdicionarLivro')?.addEventListener('click', () => {
    if (!bibliotecaId) {
        mostrarMensagem("Biblioteca não identificada.", "erro");
        return;
    }
    modalCadastro.style.display = 'flex';
});

// Fechamento global de modais
window.addEventListener('click', (e) => {
    if (e.target === modalEmprestimo) modalEmprestimo.style.display = 'none';
    if (e.target === modalDevolucao) modalDevolucao.style.display = 'none';
    if (e.target === modalCadastro) modalCadastro.style.display = 'none';
    if (e.target === modalEdicao) modalEdicao.style.display = 'none';
    if (e.target === modalListar) modalListar.style.display = 'none';
});

if (closeCadastroModal) {
    closeCadastroModal.addEventListener('click', () => modalCadastro.style.display = 'none');
}
if (closeEdicaoModal) {
    closeEdicaoModal.addEventListener('click', () => modalEdicao.style.display = 'none');
}

formCadastro.addEventListener('submit', cadastrarLivro);
formEdicao.addEventListener('submit', editarLivro);

setLoading(true);