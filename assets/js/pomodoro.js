// Módulo de Pomodoro
let timerInterval;
let tempoRestante = 25 * 60; // 25 minutos em segundos
let emPausa = false;
let contadorInterrupcoes = 0;
let sessaoAtual = null;

function initPomodoro() {
    // Configurar valores iniciais
    atualizarConfigPomodoro();
    
    // Atualizar lista de tarefas
    atualizarListaTarefasPomodoro();
}

// Atualizar configurações do Pomodoro
function atualizarConfigPomodoro() {
    const duracaoTimer = document.getElementById('duracao-timer').value;
    const duracaoPausa = document.getElementById('duracao-pausa').value;
    
    document.getElementById('duracao-valor').textContent = duracaoTimer;
    document.getElementById('pausa-valor').textContent = duracaoPausa;
    
    // Atualizar tempo restante se o timer não estiver rodando
    if (!timerInterval) {
        tempoRestante = duracaoTimer * 60;
        atualizarDisplayTimer();
    }
}

// Atualizar lista de tarefas no seletor do Pomodoro
function atualizarListaTarefasPomodoro() {
    const seletor = document.getElementById('tarefa-pomodoro');
    
    // Limpar opções atuais
    seletor.innerHTML = '<option value="">-- Selecione uma tarefa --</option>';
    
    // Adicionar tarefas não concluídas
    const tarefasPendentes = obterTarefasPendentes();
    
    tarefasPendentes.forEach(tarefa => {
        const option = document.createElement('option');
        option.value = tarefa.id;
        option.textContent = tarefa.titulo;
        seletor.appendChild(option);
    });
}

// Iniciar timer
function iniciarTimer() {
    // Se já estiver rodando, não fazer nada
    if (timerInterval) return;
    
    // Se estiver em pausa, continuar de onde parou
    if (!emPausa) {
        // Criar nova sessão
        const tarefaSelecionada = document.getElementById('tarefa-pomodoro').value;
        
        sessaoAtual = {
            inicio: new Date().toISOString(),
            duracao: parseInt(document.getElementById('duracao-timer').value),
            tipo: 'Foco',
            tarefaId: tarefaSelecionada || null,
            interrupcoes: 0,
            concluida: false
        };
        
        // Resetar contador de interrupções
        contadorInterrupcoes = 0;
        document.getElementById('count-interrupcoes').textContent = '0';
        
        // Definir tempo baseado na configuração
        tempoRestante = parseInt(document.getElementById('duracao-timer').value) * 60;
    }
    
    // Marcar como não em pausa
    emPausa = false;
    
    // Iniciar intervalo
    timerInterval = setInterval(() => {
        // Decrementar tempo
        tempoRestante--;
        
        // Atualizar display
        atualizarDisplayTimer();
        
        // Verificar se acabou
        if (tempoRestante <= 0) {
            finalizarTimer();
        }
    }, 1000);
}

// Pausar timer
function pausarTimer() {
    // Se não estiver rodando, não fazer nada
    if (!timerInterval) return;
    
    // Parar intervalo
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Marcar como em pausa
    emPausa = true;
}

// Parar timer
function pararTimer() {
    // Se não estiver rodando nem em pausa, não fazer nada
    if (!timerInterval && !emPausa) return;
    
    // Parar intervalo
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Resetar estado
    emPausa = false;
    
    // Perguntar se deseja salvar a sessão parcial
    if (sessaoAtual && confirm('Deseja salvar esta sessão parcial?')) {
        finalizarSessao(false);
    } else {
        // Resetar sessão
        sessaoAtual = null;
    }
    
    // Resetar tempo
    tempoRestante = parseInt(document.getElementById('duracao-timer').value) * 60;
    
    // Atualizar display
    atualizarDisplayTimer();
    
    // Resetar contador de interrupções
    contadorInterrupcoes = 0;
    document.getElementById('count-interrupcoes').textContent = '0';
}

// Finalizar timer (quando chega a zero)
function finalizarTimer() {
    // Parar intervalo
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Tocar som de finalização
    // (Implementação futura)
    
    // Finalizar sessão
    finalizarSessao(true);
    
    // Mostrar notificação
    mostrarNotificacao('Sessão Pomodoro concluída! +15 XP', 5000);
    
    // Perguntar se deseja iniciar pausa
    if (confirm('Iniciar pausa?')) {
        iniciarPausa();
    } else {
        // Resetar tempo
        tempoRestante = parseInt(document.getElementById('duracao-timer').value) * 60;
        atualizarDisplayTimer();
    }
}

// Iniciar pausa
function iniciarPausa() {
    // Definir tempo de pausa
    tempoRestante = parseInt(document.getElementById('duracao-pausa').value) * 60;
    
    // Atualizar display
    atualizarDisplayTimer();
    
    // Criar nova sessão de pausa
    sessaoAtual = {
        inicio: new Date().toISOString(),
        duracao: parseInt(document.getElementById('duracao-pausa').value),
        tipo: 'Pausa',
        tarefaId: null,
        interrupcoes: 0,
        concluida: false
    };
    
    // Resetar contador de interrupções
    contadorInterrupcoes = 0;
    document.getElementById('count-interrupcoes').textContent = '0';
    
    // Iniciar timer
    iniciarTimer();
}

// Finalizar sessão
function finalizarSessao(concluida) {
    if (!sessaoAtual) return;
    
    // Atualizar dados da sessão
    sessaoAtual.fim = new Date().toISOString();
    sessaoAtual.interrupcoes = contadorInterrupcoes;
    sessaoAtual.concluida = concluida;
    
    // Calcular duração real
    const inicio = new Date(sessaoAtual.inicio);
    const fim = new Date(sessaoAtual.fim);
    const duracaoReal = Math.round((fim - inicio) / 60000); // em minutos
    sessaoAtual.duracaoReal = duracaoReal;
    
    // Carregar sessões existentes
    const pomodoros = JSON.parse(localStorage.getItem('pomodoros') || '[]');
    
    // Adicionar nova sessão
    pomodoros.push(sessaoAtual);
    
    // Salvar localmente
    localStorage.setItem('pomodoros', JSON.stringify(pomodoros));
    
    // Se foi uma sessão de foco concluída, adicionar XP
    if (sessaoAtual.tipo === 'Foco' && concluida) {
        adicionarXP(15);
    }
    
    // Tentar enviar para Google Sheets (se configurado)
    try {
        enviarParaGoogleSheets('pomodoros', sessaoAtual);
    } catch (error) {
        console.error('Erro ao enviar para Google Sheets:', error);
    }
    
    // Atualizar dashboard
    atualizarDashboard();
    
    // Resetar sessão atual
    sessaoAtual = null;
}

// Marcar interrupção
function marcarInterrupcao() {
    // Só contar se o timer estiver rodando
    if (timerInterval || emPausa) {
        contadorInterrupcoes++;
        document.getElementById('count-interrupcoes').textContent = contadorInterrupcoes;
    }
}

// Atualizar display do timer
function atualizarDisplayTimer() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    
    document.getElementById('tempo-restante').textContent = 
        `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

// Obter estatísticas de Pomodoro
function obterEstatisticasPomodoro(dias = 7) {
    const pomodoros = JSON.parse(localStorage.getItem('pomodoros') || '[]');
    
    // Filtrar pelos últimos X dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    
    const sessoesFiltradas = pomodoros.filter(sessao => 
        new Date(sessao.inicio) >= dataLimite
    );
    
    // Calcular estatísticas
    const sessoesFoco = sessoesFiltradas.filter(s => s.tipo === 'Foco');
    const sessoesCompletas = sessoesFoco.filter(s => s.concluida);
    
    const totalInterrupcoes = sessoesFoco.reduce((total, sessao) => total + sessao.interrupcoes, 0);
    const tempoTotalFoco = sessoesCompletas.reduce((total, sessao) => total + sessao.duracao, 0);
    
    return {
        total: sessoesFoco.length,
        completas: sessoesCompletas.length,
        interrupcoes: totalInterrupcoes,
        tempoTotal: tempoTotalFoco,
        mediaInterrupcoes: sessoesFoco.length > 0 ? totalInterrupcoes / sessoesFoco.length : 0
    };
}
