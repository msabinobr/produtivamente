// Arquivo principal da aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar a aplicação
    initApp();
    
    // Carregar dados salvos localmente
    carregarDadosLocais();
    
    // Configurar navegação
    setupNavigation();
});

// Inicialização da aplicação
function initApp() {
    // Verificar se o modo TDAH estava ativo
    const modoTDAH = localStorage.getItem('modoTDAH') === 'true';
    if (modoTDAH) {
        document.body.classList.add('modo-tdah');
        document.getElementById('toggle-tdah').textContent = '✨ Modo Normal';
    }
    
    // Inicializar módulos
    initCheckin();
    initTarefas();
    initPomodoro();
    initDashboard();
}

// Alternar entre modo normal e TDAH
function toggleModoTDAH() {
    const body = document.body;
    const isModoTDAH = body.classList.contains('modo-tdah');
    
    if (isModoTDAH) {
        body.classList.remove('modo-tdah');
        localStorage.setItem('modoTDAH', 'false');
        document.getElementById('toggle-tdah').textContent = '✨ Modo TDAH';
    } else {
        body.classList.add('modo-tdah');
        localStorage.setItem('modoTDAH', 'true');
        document.getElementById('toggle-tdah').textContent = '✨ Modo Normal';
    }
    
    // Mostrar notificação
    mostrarNotificacao(isModoTDAH ? 'Modo normal ativado' : 'Modo TDAH ativado');
}

// Configurar navegação entre seções
function setupNavigation() {
    const menuLinks = document.querySelectorAll('.menu-items a');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe active de todos os links
            menuLinks.forEach(item => item.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            this.classList.add('active');
            
            // Obter a seção a ser mostrada
            const sectionId = this.getAttribute('data-section');
            
            // Esconder todas as seções
            document.querySelectorAll('.section-container').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostrar a seção selecionada
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Carregar dados salvos localmente
function carregarDadosLocais() {
    // Carregar check-ins
    const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
    
    // Carregar tarefas
    const tarefas = JSON.parse(localStorage.getItem('tarefas') || '[]');
    
    // Carregar sessões pomodoro
    const pomodoros = JSON.parse(localStorage.getItem('pomodoros') || '[]');
    
    // Carregar dados de gamificação
    const gamificacao = JSON.parse(localStorage.getItem('gamificacao') || '{"xp": 0, "level": 1}');
    
    // Atualizar XP na interface
    atualizarXP(gamificacao.xp, gamificacao.level);
    
    return { checkins, tarefas, pomodoros, gamificacao };
}

// Salvar dados localmente
function salvarDadosLocais(tipo, dados) {
    localStorage.setItem(tipo, JSON.stringify(dados));
}

// Mostrar notificação
function mostrarNotificacao(texto, duracao = 3000) {
    const notificacao = document.getElementById('notificacao');
    const notificacaoTexto = document.getElementById('notificacao-texto');
    
    notificacaoTexto.textContent = texto;
    notificacao.classList.add('show');
    
    setTimeout(() => {
        notificacao.classList.remove('show');
    }, duracao);
}

// Atualizar XP e nível na interface
function atualizarXP(xp, level) {
    // Calcular XP necessário para o próximo nível
    const xpProximoNivel = level * 100;
    
    // Calcular progresso percentual
    const progresso = (xp / xpProximoNivel) * 100;
    
    // Atualizar interface
    document.querySelector('.xp-display span:first-child').textContent = `Level ${level}`;
    document.querySelector('.xp-progress').style.width = `${progresso}%`;
    document.querySelector('.xp-display span:last-child').textContent = `${xp} / ${xpProximoNivel} XP`;
}

// Adicionar XP e verificar level up
function adicionarXP(quantidade) {
    // Carregar dados atuais
    const gamificacao = JSON.parse(localStorage.getItem('gamificacao') || '{"xp": 0, "level": 1}');
    
    // Adicionar XP
    gamificacao.xp += quantidade;
    
    // Verificar level up
    const xpNecessario = gamificacao.level * 100;
    if (gamificacao.xp >= xpNecessario) {
        gamificacao.level += 1;
        gamificacao.xp -= xpNecessario;
        mostrarNotificacao(`🎉 Level Up! Você alcançou o nível ${gamificacao.level}!`, 5000);
    } else {
        mostrarNotificacao(`+${quantidade} XP`);
    }
    
    // Atualizar interface
    atualizarXP(gamificacao.xp, gamificacao.level);
    
    // Salvar dados
    salvarDadosLocais('gamificacao', gamificacao);
    
    return gamificacao;
}

// Formatar data para exibição
function formatarData(data) {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

// Formatar hora para exibição
function formatarHora(data) {
    const d = new Date(data);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Função para integração com Google Sheets
async function enviarParaGoogleSheets(tipo, dados) {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbwVqIB93NcWXX4j-YPRLj1QuozQRrHRWsZaOiaQIb6zjbWPbIsisRuC8Pv-tRUuUHdFoA/exec', {
            method: 'POST',
            body: JSON.stringify({
                action: tipo === 'checkins' ? 'salvarCheckin' : 
                        tipo === 'tarefas' ? 'salvarTarefa' :
                        tipo === 'tarefas_atualizacao' ? 'atualizarTarefa' :
                        tipo === 'tarefas_exclusao' ? 'excluirTarefa' :
                        tipo === 'pomodoros' ? 'salvarPomodoro' : 'atualizarGamificacao',
                [tipo === 'checkins' ? 'checkin' : 
                 tipo === 'tarefas' || tipo === 'tarefas_atualizacao' ? 'tarefa' :
                 tipo === 'tarefas_exclusao' ? 'id' :
                 tipo === 'pomodoros' ? 'pomodoro' : 'gamificacao']: dados
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar para Google Sheets:', error);
        return { success: false, message: error.toString() };
    }
}

// Exportar dados para JSON
function exportarDados() {
    const dados = {
        checkins: JSON.parse(localStorage.getItem('checkins') || '[]'),
        tarefas: JSON.parse(localStorage.getItem('tarefas') || '[]'),
        pomodoros: JSON.parse(localStorage.getItem('pomodoros') || '[]'),
        gamificacao: JSON.parse(localStorage.getItem('gamificacao') || '{"xp": 0, "level": 1}')
    };
    
    const dataStr = JSON.stringify(dados, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'produtivamente_dados.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Importar dados de JSON
function importarDados(jsonString) {
    try {
        const dados = JSON.parse(jsonString);
        
        // Validar estrutura dos dados
        if (!dados.checkins || !dados.tarefas || !dados.pomodoros || !dados.gamificacao) {
            throw new Error('Formato de dados inválido');
        }
        
        // Salvar dados
        localStorage.setItem('checkins', JSON.stringify(dados.checkins));
        localStorage.setItem('tarefas', JSON.stringify(dados.tarefas));
        localStorage.setItem('pomodoros', JSON.stringify(dados.pomodoros));
        localStorage.setItem('gamificacao', JSON.stringify(dados.gamificacao));
        
        // Recarregar a página para atualizar os dados
        window.location.reload();
        
        return true;
    } catch (error) {
        console.error('Erro ao importar dados:', error);
        mostrarNotificacao('Erro ao importar dados. Verifique o formato do arquivo.');
        return false;
    }
}
