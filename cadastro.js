import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

document.getElementById('formCadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailCadastro').value;
    const senha = document.getElementById('senhaCadastro').value;

    createUserWithEmailAndPassword(auth, email, senha)
        .then(() => {
            alert("Conta criada com sucesso!");
            window.location.href = "index.html";
        })
        .catch(error => alert("Erro ao cadastrar: " + error.message));
});