import { auth, db } from "./Firebase_Auth.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { Estudante } from "./Models/Estudante.js";
import { gerarProximoIdUsuario } from "./Gerar_Id_Usuario.js";

console.log("Cadastro Estudante carregado");

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

        const emailgov = document.getElementById('emailEstu').value.trim();
        const password = document.getElementById('passwordEstu').value;
        const confirmPassword = document.getElementById('confirmPasswordEstu').value;
        const idEstudante = document.getElementById('idEstu').value.trim();

        if (!emailgov || !password || !confirmPassword || !idEstudante) {
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
        if (!emailgov.endsWith('@aluno.ce.gov.br')) {
            mostrarMensagem('O email deve ser do domínio @aluno.ce.gov.br', 'erro');
            return;
        }

        try {
            // Gerar ID numérico único
            const idNumerico = await gerarProximoIdUsuario();

            const userCredential = await createUserWithEmailAndPassword(auth, emailgov, password);
            const user = userCredential.user;
            const estudante = new Estudante(user.uid, emailgov, { 
                idEstudante, 
                email: emailgov,
                idNumerico
            });
            const userData = estudante.toJSON();

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