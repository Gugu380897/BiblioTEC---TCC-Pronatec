import { auth, db } from "./Firebase_Auth.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { Leitor } from "./Models/Leitor.js";
import { gerarProximoIdUsuario } from "./Gerar_Id_Usuario.js";

console.log("Cadastro Leitor carregado");

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

const signUp = document.getElementById('submitSignUp');
if (signUp) {
    signUp.addEventListener('click', async (event) => {
        event.preventDefault();

        const email = document.getElementById('emailUsu').value.trim();
        const password = document.getElementById('passwordUsu').value;
        const confirmPassword = document.getElementById('confirmPasswordUsu').value;
        const cpf = document.getElementById('cpfUsu').value.trim();

        if (!email || !password || !confirmPassword || !cpf) {
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
            // Gerar ID numérico único
            const idNumerico = await gerarProximoIdUsuario();

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const leitor = new Leitor(user.uid, email, { cpf, idNumerico });
            const userData = leitor.toJSON();

            mostrarMensagem("Cadastro Realizado com Sucesso", 'sucesso');

            const userRef = ref(db, `users/${user.uid}`);
            await set(userRef, userData);

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
        } catch (error) {
            console.error(error);
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
}