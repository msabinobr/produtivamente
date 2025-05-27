// Módulo de Tarefas
let tarefas = [];

function initTarefas() {
    // Carregar tarefas salvas
    tarefas = JSON.parse(localStorage.getItem('tarefas') || '[]');
    
    // Renderizar tarefas
    renderizarTarefas();
    
    // Configurar filtros
    const botoesFiltro = document.querySelectorAll('.filtro-btn');
    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', function() {
            // Remover seleção anterior
            botoesFiltro.forEach(b => b.classList.remove('active'));
            
            // Adicionar seleção ao botão clicado
            this.classList.add('active');
            
            // Filtrar tarefas
            const filtro = this.getAttribute('data-filtro');
            renderizarTarefas(filtro);
        });
    });
    
    // Configurar tecla Enter para adicionar tarefa
    document.getElementById('nova-tarefa').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adicionarTarefa();
        }
    });
}

// Adicionar nova tarefa
function adicionarTarefa() {
    const input = document.getElementById('nova-tarefa');
    const textoTarefa = input.value.trim();
    
    if (textoTarefa === '') {
        mostrarNotificacao('Digite uma tarefa válida');
        return;
    }
    
    // Criar objeto de tarefa com parsing inteligente
    const tarefa = parseTarefa(textoTarefa);
    
    // Adicionar à lista
    tarefas.push(tarefa);
    
    // Salvar localmente
    salvarDadosLocais('tarefas', tarefas);
    
    // Limpar input
    input.value = '';
    
    // Renderizar tarefas
    renderizarTarefas();
    
    // Mostrar notificação
    mostrarNotificacao('Tarefa adicionada com sucesso!');
    
    // Tentar enviar para Google Sheets (se configurado)
    try {
        enviarParaGoogleSheets('tarefas', tarefa);
    } catch (error) {
        console.error('Erro ao enviar para Google Sheets:', error);
    }
    
    // Atualizar lista de tarefas no Pomodoro
    atualizarListaTarefasPomodoro();
}

// Parsing inteligente de tarefa
function parseTarefa(texto) {
    const hoje = new Date();
    let prazo = null;
    let prioridade = 'Média';
    let energiaNecessaria = 'Média';
    
    // Detectar prazo
    if (texto.toLowerCase().includes('hoje')) {
        prazo = new Date();
    } else if (texto.toLowerCase().includes('amanhã') || texto.toLowerCase().includes('amanha')) {
        prazo = new Date();
        prazo.setDate(prazo.getDate() + 1);
    }
    
    // Detectar prioridade
    if (texto.toLowerCase().includes('#urgente') || texto.toLowerCase().includes('#alta')) {
        prioridade = 'Alta';
    } else if (texto.toLowerCase().includes('#baixa')) {
        prioridade = 'Baixa';
    }
    
    // Estimar energia necessária
    if (texto.toLowerCase().includes('#fácil') || texto.toLowerCase().includes('#facil') || texto.toLowerCase().includes('#leve')) {
        energiaNecessaria = 'Baixa';
    } else if (texto.toLowerCase().includes('#difícil') || texto.toLowerCase().includes('#dificil') || texto.toLowerCase().includes('#pesada')) {
        energiaNecessaria = 'Alta';
    }
    
    // Limpar texto de tags
    let titulo = texto
        .replace(/#urgente/gi, '')
        .replace(/#alta/gi, '')
        .replace(/#baixa/gi, '')
        .replace(/#fácil/gi, '')
        .replace(/#facil/gi, '')
        .replace(/#leve/gi, '')
        .replace(/#difícil/gi, '')
        .replace(/#dificil/gi, '')
        .replace(/#pesada/gi, '')
        .trim();
    
    return {
        id: Date.now().toString(),
        titulo: titulo,
        concluida: false,
        dataCriacao: hoje.toISOString(),
        prazo: prazo ? prazo.toISOString() : null,
        prioridade: prioridade,
        energiaNecessaria: energiaNecessaria
    };
}

// Renderizar lista de tarefas
function renderizarTarefas(filtro = 'todas') {
    const listaTarefas = document.querySelector('.tarefas-lista');
    listaTarefas.innerHTML = '';
    
    // Filtrar tarefas
    let tarefasFiltradas = [...tarefas];
    
    if (filtro === 'hoje') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        tarefasFiltradas = tarefas.filter(tarefa => {
            if (!tarefa.prazo) return false;
            
            const dataPrazo = new Date(tarefa.prazo);
            dataPrazo.setHours(0, 0, 0, 0);
            
            return dataPrazo.getTime() === hoje.getTime();
        });
    } else if (filtro === 'alta') {
        tarefasFiltradas = tarefas.filter(tarefa => tarefa.prioridade === 'Alta');
    } else if (filtro === 'energia') {
        tarefasFiltradas = tarefas.filter(tarefa => tarefa.energiaNecessaria === 'Baixa');
    }
    
    // Ordenar por prioridade e depois por prazo
    tarefasFiltradas.sort((a, b) => {
        // Primeiro por conclusão
        if (a.concluida !== b.concluida) {
            return a.concluida ? 1 : -1;
        }
        
        // Depois por prioridade
        const prioridadeOrdem = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
        if (a.prioridade !== b.prioridade) {
            return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
        }
        
        // Por fim, por prazo
        if (a.prazo && b.prazo) {
            return new Date(a.prazo) - new Date(b.prazo);
        } else if (a.prazo) {
            return -1;
        } else if (b.prazo) {
            return 1;
        }
        
        // Se nada diferir, manter ordem original
        return 0;
    });
    
    // Renderizar cada tarefa
    tarefasFiltradas.forEach(tarefa => {
        const tarefaElement = document.createElement('div');
        tarefaElement.className = `tarefa-card ${tarefa.concluida ? 'concluida' : ''}`;
        
        // Definir cor da borda baseada na prioridade
        if (tarefa.prioridade === 'Alta') {
            tarefaElement.style.borderLeftColor = 'var(--cor-erro)';
        } else if (tarefa.prioridade === 'Baixa') {
            tarefaElement.style.borderLeftColor = 'var(--cor-secundaria)';
        }
        
        tarefaElement.innerHTML = `
            <div class="tarefa-check">
                <input type="checkbox" ${tarefa.concluida ? 'checked' : ''} onchange="marcarTarefa('${tarefa.id}')">
            </div>
            <div class="tarefa-conteudo">
                <div class="tarefa-titulo">${tarefa.titulo}</div>
                <div class="tarefa-meta">
                    ${tarefa.prazo ? `<span>Prazo: ${formatarData(tarefa.prazo)}</span>` : ''}
                    <span>Prioridade: ${tarefa.prioridade}</span>
                    <span>Energia: ${tarefa.energiaNecessaria}</span>
                </div>
            </div>
            <div class="tarefa-acoes">
                <button onclick="editarTarefa('${tarefa.id}')">✏️</button>
                <button onclick="excluirTarefa('${tarefa.id}')">🗑️</button>
            </div>
        `;
        
        listaTarefas.appendChild(tarefaElement);
    });
    
    // Mostrar mensagem se não houver tarefas
    if (tarefasFiltradas.length === 0) {
        listaTarefas.innerHTML = `
            <div class="sem-tarefas">
                <p>Nenhuma tarefa encontrada para este filtro.</p>
            </div>
        `;
    }
}

// Marcar tarefa como concluída/não concluída
function marcarTarefa(id) {
    // Encontrar tarefa
    const tarefa = tarefas.find(t => t.id === id);
    
    if (tarefa) {
        // Inverter estado
        tarefa.concluida = !tarefa.concluida;
        
        // Se foi marcada como concluída
        if (tarefa.concluida) {
            // Adicionar XP
            adicionarXP(20);
            mostrarNotificacao(`Tarefa concluída! +20 XP`);
        }
        
        // Salvar localmente
        salvarDadosLocais('tarefas', tarefas);
        
        // Renderizar tarefas
        renderizarTarefas();
        
        // Atualizar dashboard
        atualizarDashboard();
        
        // Tentar enviar para Google Sheets (se configurado)
        try {
            enviarParaGoogleSheets('tarefas_atualizacao', tarefa);
        } catch (error) {
            console.error('Erro ao enviar para Google Sheets:', error);
        }
    }
}

// Editar tarefa
function editarTarefa(id) {
    // Encontrar tarefa
    const tarefa = tarefas.find(t => t.id === id);
    
    if (tarefa) {
        // Implementação simplificada: apenas editar o título
        const novoTitulo = prompt('Editar tarefa:', tarefa.titulo);
        
        if (novoTitulo !== null && novoTitulo.trim() !== '') {
            tarefa.titulo = novoTitulo.trim();
            
            // Salvar localmente
            salvarDadosLocais('tarefas', tarefas);
            
            // Renderizar tarefas
            renderizarTarefas();
            
            // Mostrar notificação
            mostrarNotificacao('Tarefa atualizada com sucesso!');
            
            // Tentar enviar para Google Sheets (se configurado)
            try {
                enviarParaGoogleSheets('tarefas_atualizacao', tarefa);
            } catch (error) {
                console.error('Erro ao enviar para Google Sheets:', error);
            }
        }
    }
}

// Excluir tarefa
function excluirTarefa(id) {
    // Confirmar exclusão
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        // Filtrar tarefa
        tarefas = tarefas.filter(t => t.id !== id);
        
        // Salvar localmente
        salvarDadosLocais('tarefas', tarefas);
        
        // Renderizar tarefas
        renderizarTarefas();
        
        // Mostrar notificação
        mostrarNotificacao('Tarefa excluída com sucesso!');
        
        // Tentar enviar para Google Sheets (se configurado)
        try {
            enviarParaGoogleSheets('tarefas_exclusao', { id });
        } catch (error) {
            console.error('Erro ao enviar para Google Sheets:', error);
        }
        
        // Atualizar lista de tarefas no Pomodoro
        atualizarListaTarefasPomodoro();
    }
}

// Obter tarefas não concluídas
function obterTarefasPendentes() {
    return tarefas.filter(t => !t.concluida);
}

// Obter tarefas concluídas recentemente
function obterTarefasConcluidasRecentes(dias = 7) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    
    return tarefas.filter(t => t.concluida && new Date(t.dataCriacao) >= dataLimite);
}
