import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const historicoContainer = document.getElementById('historicoContainer');
let treinosDoBanco = []; // Cache local para os filtros
let idDoTreinoAlvo = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        carregarHistoricoDoBanco(user.uid);
    } else {
        window.location.href = "login.html";
    }
});

async function carregarHistoricoDoBanco(uid) {
    historicoContainer.innerHTML = '<p>Carregando treinos da nuvem...</p>';
    treinosDoBanco = [];

    try {
        const q = query(collection(db, "treinos"), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            treinosDoBanco.push({ id: doc.id, ...doc.data() });
        });

        renderizarTreinos(treinosDoBanco);
    } catch (error) {
        historicoContainer.innerHTML = '<p>Erro ao carregar dados.</p>';
        console.error(error);
    }
}

// Sua lógica de filtros permanece igual, mas renderiza o array 'treinosDoBanco'
function renderizarTreinos(treinos, filtroData = '', filtroGrupo = '') {
    historicoContainer.innerHTML = '';

    if (treinos.length === 0) {
        historicoContainer.innerHTML = '<p>Nenhum treino registrado ainda.</p>';
        return;
    }

    let treinosFiltrados = treinos;

    if (filtroData) {
        treinosFiltrados = treinosFiltrados.filter(treino => treino.data === filtroData);
    }
    if (filtroGrupo) {
        treinosFiltrados = treinosFiltrados.filter(treino => {
            return treino.exercicios && treino.exercicios.some(ex => ex.grupo === filtroGrupo);
        });
    }

    if (treinosFiltrados.length === 0) {
        historicoContainer.innerHTML = '<p>Nenhum treino encontrado com esses filtros.</p>';
        return;
    }

    treinosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

    treinosFiltrados.forEach(treino => {
        const dataFormatada = treino.data.split('-').reverse().join('/');

        let listaExHTML = '';
        if (treino.exercicios && treino.exercicios.length > 0) {
            listaExHTML = '<ul class="exercicios-list" style="margin-bottom: 10px;">';
            treino.exercicios.forEach(ex => {
                listaExHTML += `
                    <li>
                        <div>
                            <strong style="color: #ff5722;">${ex.grupo}</strong>: ${ex.nome} <br>
                            <small style="color: #bbb;">${ex.carga}kg | ${ex.series}x${ex.repeticoes}</small>
                        </div>
                    </li>`;
            });
            listaExHTML += '</ul>';
        } else {
            listaExHTML = '<p style="color: #bbb; margin-bottom: 10px;"><em>Nenhum exercício de musculação registrado.</em></p>';
        }

        let cardioHTML = '';
        if (treino.cardio && treino.cardio.fez) {
            cardioHTML = `<p style="margin-top: 10px;">🏃‍♂️ <strong>Cardio:</strong> ${treino.cardio.tipo} por ${treino.cardio.tempo} min</p>`;
        }

        const card = document.createElement('div');
        card.className = 'card treino-card';
        card.innerHTML = `
            <h2>📅 Data: ${dataFormatada}</h2>
            <hr style="border-color: #333; margin: 10px 0;">
            ${listaExHTML}
            ${cardioHTML}
            <div class="acoes-treino">
                <button class="btn btn-edit" onclick="editarTreino('${treino.id}')">✏️ Editar</button>
                <button class="btn btn-danger" onclick="chamarModalExcluir('${treino.id}')">🗑️ Excluir</button>
            </div>
        `;
        historicoContainer.appendChild(card);
    });
}

// Callbacks atrelados ao Window
window.aplicarFiltros = function() {
    const data = document.getElementById('filtroData').value;
    const grupo = document.getElementById('filtroGrupo').value;
    renderizarTreinos(treinosDoBanco, data, grupo);
};

window.limparFiltros = function() {
    document.getElementById('filtroData').value = '';
    document.getElementById('filtroGrupo').value = '';
    renderizarTreinos(treinosDoBanco);
};

window.editarTreino = function(id) {
    window.location.href = `registro.html?editId=${id}`;
};

window.chamarModalExcluir = function(id) {
    idDoTreinoAlvo = id;
    document.getElementById('fundoEscuro').style.display = 'block';
    document.getElementById('caixaExcluir').style.display = 'block';
};

document.getElementById('btnCancelar').addEventListener('click', function() {
    document.getElementById('fundoEscuro').style.display = 'none';
    document.getElementById('caixaExcluir').style.display = 'none';
    idDoTreinoAlvo = null;
});

document.getElementById('btnConfirmar').addEventListener('click', async function() {
    if(idDoTreinoAlvo !== null) {
        document.getElementById('btnConfirmar').innerText = "Apagando...";
        try {
            await deleteDoc(doc(db, "treinos", idDoTreinoAlvo));
            
            // Remove localmente do array para não ter que baixar tudo de novo
            treinosDoBanco = treinosDoBanco.filter(t => t.id !== idDoTreinoAlvo);
            
            document.getElementById('fundoEscuro').style.display = 'none';
            document.getElementById('caixaExcluir').style.display = 'none';
            document.getElementById('btnConfirmar').innerText = "OK";
            idDoTreinoAlvo = null;
            
            aplicarFiltros(); 
        } catch(error) {
            alert("Erro ao excluir: " + error.message);
            document.getElementById('btnConfirmar').innerText = "OK";
        }
    }
});