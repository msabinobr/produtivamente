// Módulo de Dashboard
let chartHumorEnergia;
let chartProdutividade;

function initDashboard() {
    // Inicializar gráficos vazios
    inicializarGraficos();
    
    // Atualizar dashboard com dados atuais
    atualizarDashboard();
}

// Inicializar gráficos vazios
function inicializarGraficos() {
    // Gráfico de Humor e Energia
    const ctxHumorEnergia = document.getElementById('humor-energia-chart');
    
    if (ctxHumorEnergia) {
        chartHumorEnergia = new Chart(ctxHumorEnergia, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Humor',
                        data: [],
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Energia',
                        data: [],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
    
    // Gráfico de Produtividade
    const ctxProdutividade = document.getElementById('produtividade-chart');
    
    if (ctxProdutividade) {
        chartProdutividade = new Chart(ctxProdutividade, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Tarefas Concluídas',
                        data: [],
                        backgroundColor: '#6366F1'
                    },
                    {
                        label: 'Pomodoros Completos',
                        data: [],
                        backgroundColor: '#10B981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
}

// Atualizar dashboard com dados atuais
function atualizarDashboard() {
    // Obter dados dos últimos 7 dias
    const checkins = obterHistoricoCheckins(7);
    const tarefasConcluidas = obterTarefasConcluidasRecentes(7);
    const estatisticasPomodoro = obterEstatisticasPomodoro(7);
    
    // Atualizar gráfico de humor e energia
    atualizarGraficoHumorEnergia(checkins);
    
    // Atualizar gráfico de produtividade
    atualizarGraficoProdutividade(tarefasConcluidas, estatisticasPomodoro);
    
    // Atualizar estatísticas da semana
    atualizarEstatisticasSemana(checkins, tarefasConcluidas, estatisticasPomodoro);
}

// Atualizar gráfico de humor e energia
function atualizarGraficoHumorEnergia(checkins) {
    if (!chartHumorEnergia || checkins.length === 0) return;
    
    // Preparar dados
    const labels = checkins.map(c => formatarData(c.data));
    const dadosHumor = checkins.map(c => c.humor);
    const dadosEnergia = checkins.map(c => c.energia);
    
    // Atualizar gráfico
    chartHumorEnergia.data.labels = labels;
    chartHumorEnergia.data.datasets[0].data = dadosHumor;
    chartHumorEnergia.data.datasets[1].data = dadosEnergia;
    chartHumorEnergia.update();
    
    // Remover placeholder se houver dados
    if (checkins.length > 0) {
        const placeholder = document.querySelector('#humor-energia-chart + .placeholder-text');
        if (placeholder) placeholder.style.display = 'none';
    }
}

// Atualizar gráfico de produtividade
function atualizarGraficoProdutividade(tarefasConcluidas, estatisticasPomodoro) {
    if (!chartProdutividade) return;
    
    // Agrupar tarefas por dia
    const tarefasPorDia = {};
    tarefasConcluidas.forEach(tarefa => {
        const data = new Date(tarefa.dataCriacao);
        const dataFormatada = formatarData(data);
        
        if (!tarefasPorDia[dataFormatada]) {
            tarefasPorDia[dataFormatada] = 0;
        }
        
        tarefasPorDia[dataFormatada]++;
    });
    
    // Obter sessões pomodoro por dia
    const pomodoros = JSON.parse(localStorage.getItem('pomodoros') || '[]');
    const pomodorosPorDia = {};
    
    // Filtrar pelos últimos 7 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 7);
    
    pomodoros.filter(p => new Date(p.inicio) >= dataLimite && p.tipo === 'Foco' && p.concluida)
             .forEach(pomodoro => {
                 const data = new Date(pomodoro.inicio);
                 const dataFormatada = formatarData(data);
                 
                 if (!pomodorosPorDia[dataFormatada]) {
                     pomodorosPorDia[dataFormatada] = 0;
                 }
                 
                 pomodorosPorDia[dataFormatada]++;
             });
    
    // Gerar labels para os últimos 7 dias
    const labels = [];
    const dadosTarefas = [];
    const dadosPomodoros = [];
    
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataFormatada = formatarData(data);
        
        labels.push(dataFormatada);
        dadosTarefas.push(tarefasPorDia[dataFormatada] || 0);
        dadosPomodoros.push(pomodorosPorDia[dataFormatada] || 0);
    }
    
    // Atualizar gráfico
    chartProdutividade.data.labels = labels;
    chartProdutividade.data.datasets[0].data = dadosTarefas;
    chartProdutividade.data.datasets[1].data = dadosPomodoros;
    chartProdutividade.update();
    
    // Remover placeholder se houver dados
    if (tarefasConcluidas.length > 0 || estatisticasPomodoro.completas > 0) {
        const placeholder = document.querySelector('#produtividade-chart + .placeholder-text');
        if (placeholder) placeholder.style.display = 'none';
    }
}

// Atualizar estatísticas da semana
function atualizarEstatisticasSemana(checkins, tarefasConcluidas, estatisticasPomodoro) {
    // Atualizar check-ins
    document.querySelector('.stat-item:nth-child(1) .stat-value').textContent = 
        `${checkins.length}/7`;
    
    // Atualizar tarefas concluídas
    document.querySelector('.stat-item:nth-child(2) .stat-value').textContent = 
        tarefasConcluidas.length;
    
    // Atualizar pomodoros
    document.querySelector('.stat-item:nth-child(3) .stat-value').textContent = 
        estatisticasPomodoro.completas;
    
    // Calcular XP ganho na semana
    const xpCheckins = checkins.length * 10;
    const xpTarefas = tarefasConcluidas.length * 20;
    const xpPomodoros = estatisticasPomodoro.completas * 15;
    const xpTotal = xpCheckins + xpTarefas + xpPomodoros;
    
    document.querySelector('.stat-item:nth-child(4) .stat-value').textContent = xpTotal;
}
