import { auth, googleProvider } from './firebase-config.js';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 1. OBSERVADOR DE ESTADO
// Se a página carregar e perceber que já existe um usuário válido, joga direto pro Início
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "index.html";
    }
});

// 2. Login com E-mail e Senha
document.getElementById('formLogin').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailLogin').value;
    const senha = document.getElementById('senhaLogin').value;

    signInWithEmailAndPassword(auth, email, senha)
        .catch(error => alert("Erro ao fazer login: " + error.message));
});

// 3. Login com o Google via POP-UP (Mais rápido e confiável para Web)
document.getElementById('btnGoogle').addEventListener('click', () => {
    signInWithPopup(auth, googleProvider)
        .catch((error) => {
            // Tratamento amigável caso o navegador ou AdBlocker bloqueie a janela
            if (error.code === 'auth/popup-blocked') {
                alert("⚠️ O pop-up do Google foi bloqueado pelo seu navegador ou AdBlocker! Por favor, desative o bloqueador para esta página ou permita pop-ups para conseguir fazer o login.");
            } else {
                alert("Erro com o Google: " + error.message);
            }
        });
});