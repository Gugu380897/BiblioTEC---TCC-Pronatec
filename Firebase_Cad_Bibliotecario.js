// JS/Firebase_Cad_Bibliotecario.js
import { auth, db } from "./Firebase_Auth.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { Bibliotecario } from "./Models/Bibliotecario.js";

console.log("Cadastro Bibliotecário carregado");

function mostrarMensagem(texto, tipo = 'sucesso') {
    const msgDiv = document.getElementById('mensagemCadastro');
    if (!msgDiv) {
        console.error("Div 'mensagemCadastro' não encontrada!");
        return;
    }
    msgDiv.textContent = texto;
    msgDiv.className = `cadMensagem ${tipo}`;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3500);
}

const form = document.getElementById('cadastroForm');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = document.getElementById('nomeBiblio').value.trim();
    const email = document.getElementById('emailBiblio').value.trim();
    const password = document.getElementById('passwordBiblio').value;
    const confirmPassword = document.getElementById('confirmPasswordBiblio').value;
    const idBibliotecarioNum = parseInt(document.getElementById('idBibliotecarioNum').value, 10); // agora é o número IDBibliotecario

    if (!nome || !email || !password || !confirmPassword || isNaN(idBibliotecarioNum)) {
        mostrarMensagem('Preencha todos os campos!', 'erro');
        return;
    }
    if (password !== confirmPassword) {
        mostrarMensagem('As senhas não coincidem!', 'erro');
        return;
    }
    if (password.length < 6) {
        mostrarMensagem('A senha deve ter pelo menos 6 caracteres!', 'erro');
        return;
    }

    try {
        // Buscar todas as bibliotecas para encontrar a que tem o IDBibliotecario correspondente
        const bibliotecasRef = ref(db, 'bibliotecas/biblioCadastradas');
        const snapshot = await get(bibliotecasRef);
        if (!snapshot.exists()) {
            mostrarMensagem('Nenhuma biblioteca cadastrada.', 'erro');
            return;
        }

        let bibliotecaId = null;
        let bibliotecaData = null;
        snapshot.forEach((child) => {
            const data = child.val();
            if (data.IDBibliotecario === idBibliotecarioNum) {
                bibliotecaId = child.key; // ex: "aguiar"
                bibliotecaData = data;
            }
        });

        if (!bibliotecaId) {
            mostrarMensagem('ID do Bibliotecário não encontrado em nenhuma biblioteca.', 'erro');
            return;
        }

        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Criar instância do Bibliotecário (incluindo o ID da biblioteca e o número)
        const bibliotecario = new Bibliotecario(user.uid, email, { 
            nome, 
            idBiblioteca: bibliotecaId,
            idBibliotecarioNum: idBibliotecarioNum
        });
        const userData = bibliotecario.toJSON();

        // Salvar no nó "bibliotecarios" (global)
        await set(ref(db, `bibliotecarios/${user.uid}`), userData);

        // Agora, salvar dentro da biblioteca em um subnó "bibliotecarios" (coleção de bibliotecários)
        await set(ref(db, `bibliotecas/biblioCadastradas/${bibliotecaId}/bibliotecarios/${user.uid}`), {
            nome: nome,
            email: email,
            uid: user.uid,
            idBibliotecarioNum: idBibliotecarioNum,
            dataCadastro: new Date().toISOString()
        });

        mostrarMensagem('Cadastro realizado com sucesso!', 'sucesso');
        setTimeout(() => {
            window.location.href = 'Login_Bibliotecario.html';
        }, 2500);

    } catch (error) {
        console.error('Erro no cadastro:', error);
        if (error.code === 'auth/email-already-in-use') {
            mostrarMensagem('E-mail já cadastrado!', 'erro');
        } else if (error.code === 'auth/weak-password') {
            mostrarMensagem('Senha muito fraca!', 'erro');
        } else if (error.code === 'auth/invalid-email') {
            mostrarMensagem('E-mail inválido!', 'erro');
        } else {
            mostrarMensagem('Erro ao cadastrar: ' + error.message, 'erro');
        }
    }
});