import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Variáveis Globais
let usuarioAtual = null;
let exerciciosTemporarios = [];
let editandoTreinoId = null; 
let editandoExercicioIndex = -1; 

const inputData = document.getElementById('dataTreino');
const selectFezCardio = document.getElementById('fezCardio');
const cardioCampos = document.getElementById('cardioCampos');
const btnAdicionarExercicio = document.getElementById('btnAdicionarExercicio');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const btnSalvarTreino = document.getElementById('btnSalvarTreino');
const listaExerciciosContainer = document.getElementById('listaExerciciosContainer');
const listaExercicios = document.getElementById('listaExercicios');
const tituloExercicio = document.getElementById('tituloExercicio');

inputData.valueAsDate = new Date();

// Proteção da Rota e Carregamento de Edição
onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioAtual = user;
        
        const params = new URLSearchParams(window.location.search);
        const editIdStr = params.get('editId');
        
        if (editIdStr) {
            editandoTreinoId = editIdStr;
            await carregarTreinoParaEdicao(editandoTreinoId);
            document.querySelector('h1').innerText = "Editar Treino";
        }
    } else {
        window.location.href = "login.html"; // Joga para o login se não tiver logado
    }
});

selectFezCardio.addEventListener('change', (e) => {
    if (e.target.value === 'sim') {
        cardioCampos.style.display = 'block';
    } else {
        cardioCampos.style.display = 'none';
        document.getElementById('tipoCardio').value = '';
        document.getElementById('tempoCardio').value = '';
    }
});

function limparFormularioExercicio() {
    document.getElementById('nomeExercicio').value = '';
    document.getElementById('carga').value = '';
    document.getElementById('series').value = '';
    document.getElementById('repeticoes').value = '';
}

btnAdicionarExercicio.addEventListener('click', () => {
    const grupo = document.getElementById('grupoMuscular').value;
    const nome = document.getElementById('nomeExercicio').value;
    const carga = document.getElementById('carga').value;
    const series = document.getElementById('series').value;
    const repeticoes = document.getElementById('repeticoes').value;

    if (!grupo || !nome || !carga || !series || !repeticoes) {
        alert("Preencha todos os campos do exercício!");
        return;
    }

    const exercicio = { grupo, nome, carga: Number(carga), series: Number(series), repeticoes: Number(repeticoes) };

    if (editandoExercicioIndex >= 0) {
        exerciciosTemporarios[editandoExercicioIndex] = exercicio;
        editandoExercicioIndex = -1;
        btnAdicionarExercicio.innerText = "+ Adicionar Exercício";
        btnAdicionarExercicio.classList.remove('btn-edit');
        btnCancelarEdicao.style.display = 'none';
        tituloExercicio.innerText = "Adicionar Exercício";
    } else {
        exerciciosTemporarios.push(exercicio);
    }
    atualizarListaUI();
    limparFormularioExercicio();
});

btnCancelarEdicao.addEventListener('click', () => {
    editandoExercicioIndex = -1;
    btnAdicionarExercicio.innerText = "+ Adicionar Exercício";
    btnAdicionarExercicio.classList.remove('btn-edit');
    btnCancelarEdicao.style.display = 'none';
    tituloExercicio.innerText = "Adicionar Exercício";
    limparFormularioExercicio();
});

function atualizarListaUI() {
    listaExercicios.innerHTML = '';
    listaExerciciosContainer.style.display = exerciciosTemporarios.length > 0 ? 'block' : 'none';

    exerciciosTemporarios.forEach((ex, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="flex-grow: 1;">
                <strong style="color: #ff5722;">${ex.grupo}</strong>: ${ex.nome} <br>
                <small style="color: #bbb;">Carga: ${ex.carga}kg | Séries: ${ex.series}x${ex.repeticoes}</small>
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn-edit" onclick="prepararEdicaoExercicio(${index})">✏️</button>
                <button class="btn btn-danger" onclick="removerExercicioTemporario(${index})">🗑️</button>
            </div>
        `;
        listaExercicios.appendChild(li);
    });
}

// Funções atreladas ao Window para funcionar com os "onclick" do HTML injetado
window.removerExercicioTemporario = function(index) {
    exerciciosTemporarios.splice(index, 1);
    atualizarListaUI();
};

window.prepararEdicaoExercicio = function(index) {
    const ex = exerciciosTemporarios[index];
    document.getElementById('grupoMuscular').value = ex.grupo;
    document.getElementById('nomeExercicio').value = ex.nome;
    document.getElementById('carga').value = ex.carga;
    document.getElementById('series').value = ex.series;
    document.getElementById('repeticoes').value = ex.repeticoes;

    editandoExercicioIndex = index;
    tituloExercicio.innerText = "Editando Exercício...";
    btnAdicionarExercicio.innerText = "💾 Salvar Alteração do Exercício";
    btnAdicionarExercicio.classList.add('btn-edit');
    btnCancelarEdicao.style.display = 'inline-block';
    document.getElementById('tituloExercicio').scrollIntoView({ behavior: 'smooth' });
};

// Integração com o Firebase ao salvar
btnSalvarTreino.addEventListener('click', async () => {
    if (exerciciosTemporarios.length === 0 && selectFezCardio.value === 'nao') {
        alert("Adicione pelo menos um exercício ou um cardio para salvar o treino!");
        return;
    }

    const treinoFinal = {
        userId: usuarioAtual.uid, // O vinculo do treino com a pessoa
        data: inputData.value,
        exercicios: exerciciosTemporarios,
        cardio: {
            fez: selectFezCardio.value === 'sim',
            tipo: document.getElementById('tipoCardio').value,
            tempo: Number(document.getElementById('tempoCardio').value) || 0
        }
    };

    btnSalvarTreino.innerText = "Salvando na Nuvem...";
    btnSalvarTreino.disabled = true;

    try {
        if (editandoTreinoId) {
            await updateDoc(doc(db, "treinos", editandoTreinoId), treinoFinal);
        } else {
            await addDoc(collection(db, "treinos"), treinoFinal);
        }

        const toast = document.getElementById("toast");
        toast.className = "toast show";
        
        setTimeout(() => {
            toast.className = toast.className.replace("show", ""); 
            window.location.href = "historico.html";
        }, 1500);
    } catch (error) {
        alert("Erro ao salvar: " + error.message);
        btnSalvarTreino.innerText = "💾 Salvar Treino Completo";
        btnSalvarTreino.disabled = false;
    }
});

async function carregarTreinoParaEdicao(id) {
    try {
        const docSnap = await getDoc(doc(db, "treinos", id));
        if (docSnap.exists()) {
            const treino = docSnap.data();
            inputData.value = treino.data;
            exerciciosTemporarios = treino.exercicios || [];
            atualizarListaUI();

            if (treino.cardio && treino.cardio.fez) {
                selectFezCardio.value = 'sim';
                cardioCampos.style.display = 'block';
                document.getElementById('tipoCardio').value = treino.cardio.tipo;
                document.getElementById('tempoCardio').value = treino.cardio.tempo;
            } else {
                selectFezCardio.value = 'nao';
            }
        }
    } catch (error) {
        console.log("Erro ao carregar edição", error);
    }
}