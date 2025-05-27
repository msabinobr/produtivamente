// Módulo de Check-ins
let humorSelecionado = 3;

function initCheckin() {
    // Configurar seleção de humor
    const botoesHumor = document.querySelectorAll('.emoji-buttons button');
    
    botoesHumor.forEach(botao => {
        botao.addEventListener('click', function() {
            // Remover seleção anterior
            botoesHumor.forEach(b => b.classList.remove('selected'));
            
            // Adicionar seleção ao botão clicado
            this.classList.add('selected');
            
            // Armazenar valor selecionado
            humorSelecionado = parseInt(this.getAttribute('data-valor'));
        });
    });
    
    // Selecionar humor médio por padrão
    botoesHumor[2].classList.add('selected');
}

// Salvar check-in
async function salvarCheckin() {
    // Obter valores do formulário
    const energia = parseInt(document.querySelector('.energia-slider').value);
    const sono = parseFloat(document.querySelector('.sono-input input').value);
    const medicacao = document.querySelector('.medicacao-check input').checked;
    const observacoes = document.querySelector('.observacoes-input textarea').value;
    
    // Criar objeto de check-in
    const checkin = {
        data: new Date().toISOString(),
        humor: humorSelecionado,
        energia: energia,
        sono: sono,
        medicacao: medicacao ? 'Sim' : 'Não',
        observacoes: observacoes
    };
    
    // Carregar check-ins existentes
    const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
    
    // Adicionar novo check-in
    checkins.push(checkin);
    
    // Salvar localmente
    localStorage.setItem('checkins', JSON.stringify(checkins));
    
    // Tentar enviar para Google Sheets (se configurado)
    try {
        const resultado = await enviarParaGoogleSheets('checkins', checkin);
        if (resultado.success) {
            console.log('Check-in enviado para Google Sheets:', resultado);
        }
    } catch (error) {
        console.error('Erro ao enviar para Google Sheets:', error);
    }
    
    // Adicionar XP
    adicionarXP(10);
    
    // Atualizar dashboard
    atualizarDashboard();
    
    // Mostrar notificação
    mostrarNotificacao('Check-in salvo com sucesso! +10 XP');
    
    // Limpar formulário
    limparFormularioCheckin();
    
    // Sugerir tarefas baseadas no estado
    sugerirTarefasBaseadasNoEstado(humorSelecionado, energia);
}

// Limpar formulário de check-in
function limparFormularioCheckin() {
    // Resetar humor para médio
    document.querySelectorAll('.emoji-buttons button').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.emoji-buttons button')[2].classList.add('selected');
    humorSelecionado = 3;
    
    // Resetar energia para média
    document.querySelector('.energia-slider').value = 3;
    
    // Manter sono como está
    
    // Desmarcar medicação
    document.querySelector('.medicacao-check input').checked = false;
    
    // Limpar observações
    document.querySelector('.observacoes-input textarea').value = '';
}

// Sugerir tarefas baseadas no estado atual
function sugerirTarefasBaseadasNoEstado(humor, energia) {
    // Verificar se o usuário está com energia ou humor baixos
    if (energia <= 2 || humor <= 2) {
        // Sugerir tarefas leves
        const tarefasLeves = [
            "Responder emails importantes (15 min)",
            "Organizar sua área de trabalho (10 min)",
            "Fazer uma pausa para meditação (5 min)",
            "Revisar sua lista de tarefas (5 min)",
            "Fazer uma caminhada curta (15 min)"
        ];
        
        // Selecionar 3 tarefas aleatórias
        const sugestoes = [];
        for (let i = 0; i < 3; i++) {
            const indice = Math.floor(Math.random() * tarefasLeves.length);
            sugestoes.push(tarefasLeves[indice]);
            tarefasLeves.splice(indice, 1);
        }
        
        // Mostrar sugestões
        setTimeout(() => {
            mostrarNotificacao(`Sugestões para hoje: ${sugestoes.join(' | ')}`, 8000);
        }, 2000);
    }
}

// Obter histórico de check-ins
function obterHistoricoCheckins(dias = 7) {
    const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
    
    // Filtrar pelos últimos X dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    
    return checkins.filter(checkin => new Date(checkin.data) >= dataLimite)
                  .sort((a, b) => new Date(a.data) - new Date(b.data));
}
