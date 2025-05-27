// Google Apps Script para integração com ProdutivaMente
// Este arquivo deve ser copiado para o Google Apps Script vinculado à sua planilha

// Configurações globais
const CONFIG = {
  SHEET_ID: '1Tx0Vrj3Lv5mTIGfWOWvUEMlNMRsUKPWbDQ_4D6SvSEA', // ID da sua planilha Google
  SHEETS: {
    CHECKINS: 'CheckIns_Diarios',
    TAREFAS: 'Tarefas_Master',
    POMODOROS: 'Pomodoro_Sessions',
    GAMIFICACAO: 'Gamificacao_Stats'
  }
};

// Função para criar a estrutura inicial da planilha
function criarEstruturaPlanilha() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  // Criar aba de Check-ins se não existir
  if (!ss.getSheetByName(CONFIG.SHEETS.CHECKINS)) {
    const sheetCheckins = ss.insertSheet(CONFIG.SHEETS.CHECKINS);
    sheetCheckins.appendRow([
      'Data', 'Humor(1-5)', 'Energia(1-5)', 'Sono(hrs)', 'Medicacao(S/N)', 'Observacoes'
    ]);
    formatarCabecalho(sheetCheckins);
  }
  
  // Criar aba de Tarefas se não existir
  if (!ss.getSheetByName(CONFIG.SHEETS.TAREFAS)) {
    const sheetTarefas = ss.insertSheet(CONFIG.SHEETS.TAREFAS);
    sheetTarefas.appendRow([
      'ID', 'Titulo', 'Descricao', 'Prazo', 'Prioridade', 'Status', 'Energia_Necessaria', 'XP_Valor'
    ]);
    formatarCabecalho(sheetTarefas);
  }
  
  // Criar aba de Pomodoro se não existir
  if (!ss.getSheetByName(CONFIG.SHEETS.POMODOROS)) {
    const sheetPomodoros = ss.insertSheet(CONFIG.SHEETS.POMODOROS);
    sheetPomodoros.appendRow([
      'Data_Hora', 'Tarefa_ID', 'Duracao_Min', 'Tipo(Foco/Pausa)', 'Interrupcoes', 'Notas'
    ]);
    formatarCabecalho(sheetPomodoros);
  }
  
  // Criar aba de Gamificação se não existir
  if (!ss.getSheetByName(CONFIG.SHEETS.GAMIFICACAO)) {
    const sheetGamificacao = ss.insertSheet(CONFIG.SHEETS.GAMIFICACAO);
    sheetGamificacao.appendRow([
      'Usuario', 'XP_Total', 'Level', 'Badges', 'Streak_Atual', 'Melhor_Streak'
    ]);
    formatarCabecalho(sheetGamificacao);
  }
  
  return {
    success: true,
    message: 'Estrutura da planilha criada com sucesso!'
  };
}

// Formatar cabeçalho da planilha
function formatarCabecalho(sheet) {
  // Congelar primeira linha
  sheet.setFrozenRows(1);
  
  // Formatar cabeçalho
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#6366F1').setFontColor('white').setFontWeight('bold');
  
  // Ajustar largura das colunas
  for (let i = 1; i <= sheet.getLastColumn(); i++) {
    sheet.setColumnWidth(i, 150);
  }
}

// Função para salvar check-in
function salvarCheckin(checkin) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.CHECKINS);
    
    // Formatar data
    const data = new Date(checkin.data);
    
    // Adicionar linha
    sheet.appendRow([
      data,
      checkin.humor,
      checkin.energia,
      checkin.sono,
      checkin.medicacao,
      checkin.observacoes
    ]);
    
    // Verificar se deve sugerir tarefas leves
    if (checkin.energia <= 2 || checkin.humor <= 2) {
      sugerirTarefasLeves();
    }
    
    return {
      success: true,
      message: 'Check-in salvo com sucesso!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao salvar check-in: ' + error.toString()
    };
  }
}

// Função para salvar tarefa
function salvarTarefa(tarefa) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);
    
    // Formatar datas
    const dataCriacao = new Date(tarefa.dataCriacao);
    const prazo = tarefa.prazo ? new Date(tarefa.prazo) : '';
    
    // Adicionar linha
    sheet.appendRow([
      tarefa.id,
      tarefa.titulo,
      '', // Descrição (vazia por padrão)
      prazo,
      tarefa.prioridade,
      tarefa.concluida ? 'Concluída' : 'Pendente',
      tarefa.energiaNecessaria,
      20 // XP padrão
    ]);
    
    return {
      success: true,
      message: 'Tarefa salva com sucesso!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao salvar tarefa: ' + error.toString()
    };
  }
}

// Função para atualizar tarefa
function atualizarTarefa(tarefa) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);
    
    // Encontrar linha da tarefa
    const dados = sheet.getDataRange().getValues();
    let linha = -1;
    
    for (let i = 1; i < dados.length; i++) {
      if (dados[i][0] === tarefa.id) {
        linha = i + 1; // +1 porque os índices começam em 0, mas as linhas em 1
        break;
      }
    }
    
    if (linha === -1) {
      return {
        success: false,
        message: 'Tarefa não encontrada'
      };
    }
    
    // Atualizar status
    sheet.getRange(linha, 6).setValue(tarefa.concluida ? 'Concluída' : 'Pendente');
    
    // Atualizar título se fornecido
    if (tarefa.titulo) {
      sheet.getRange(linha, 2).setValue(tarefa.titulo);
    }
    
    return {
      success: true,
      message: 'Tarefa atualizada com sucesso!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao atualizar tarefa: ' + error.toString()
    };
  }
}

// Função para excluir tarefa
function excluirTarefa(id) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);
    
    // Encontrar linha da tarefa
    const dados = sheet.getDataRange().getValues();
    let linha = -1;
    
    for (let i = 1; i < dados.length; i++) {
      if (dados[i][0] === id) {
        linha = i + 1; // +1 porque os índices começam em 0, mas as linhas em 1
        break;
      }
    }
    
    if (linha === -1) {
      return {
        success: false,
        message: 'Tarefa não encontrada'
      };
    }
    
    // Excluir linha
    sheet.deleteRow(linha);
    
    return {
      success: true,
      message: 'Tarefa excluída com sucesso!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao excluir tarefa: ' + error.toString()
    };
  }
}

// Função para salvar sessão pomodoro
function salvarPomodoro(pomodoro) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.POMODOROS);
    
    // Formatar data
    const dataHora = new Date(pomodoro.inicio);
    
    // Adicionar linha
    sheet.appendRow([
      dataHora,
      pomodoro.tarefaId || '',
      pomodoro.duracao,
      pomodoro.tipo,
      pomodoro.interrupcoes,
      pomodoro.concluida ? 'Concluída' : 'Interrompida'
    ]);
    
    return {
      success: true,
      message: 'Sessão Pomodoro salva com sucesso!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao salvar sessão Pomodoro: ' + error.toString()
    };
  }
}

// Função para atualizar dados de gamificação
function atualizarGamificacao(dados) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.GAMIFICACAO);
    
    // Verificar se já existe registro para o usuário
    const dadosSheet = sheet.getDataRange().getValues();
    let linha = -1;
    const usuario = 'default'; // Pode ser personalizado no futuro
    
    for (let i = 1; i < dadosSheet.length; i++) {
      if (dadosSheet[i][0] === usuario) {
        linha = i + 1;
        break;
      }
    }
    
    if (linha === -1) {
      // Adicionar novo registro
      sheet.appendRow([
        usuario,
        dados.xp,
        dados.level,
        '', // Badges (vazio por padrão)
        0, // Streak atual
        0 // Melhor streak
      ]);
    } else {
      // Atualizar registro existente
      sheet.getRange(linha, 2).setValue(dados.xp);
      sheet.getRange(linha, 3).setValue(dados.level);
    }
    
    return {
      success: true,
      message: 'Dados de gamificação atualizados com sucesso!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao atualizar dados de gamificação: ' + error.toString()
    };
  }
}

// Função para sugerir tarefas leves
function sugerirTarefasLeves() {
  // Esta função pode ser expandida para usar IA ou lógica mais complexa
  const tarefasLeves = [
    "Responder emails importantes (15 min)",
    "Organizar sua área de trabalho (10 min)",
    "Fazer uma pausa para meditação (5 min)",
    "Revisar sua lista de tarefas (5 min)",
    "Fazer uma caminhada curta (15 min)"
  ];
  
  // Selecionar 3 tarefas aleatórias
  const sugestoes = [];
  const copiaLeves = [...tarefasLeves];
  
  for (let i = 0; i < 3; i++) {
    if (copiaLeves.length === 0) break;
    
    const indice = Math.floor(Math.random() * copiaLeves.length);
    sugestoes.push(copiaLeves[indice]);
    copiaLeves.splice(indice, 1);
  }
  
  return sugestoes;
}

// Configurar Web App para receber requisições do frontend
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'API do ProdutivaMente está funcionando!'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    let resultado;
    
    switch (dados.action) {
      case 'criarEstrutura':
        resultado = criarEstruturaPlanilha();
        break;
      case 'salvarCheckin':
        resultado = salvarCheckin(dados.checkin);
        break;
      case 'salvarTarefa':
        resultado = salvarTarefa(dados.tarefa);
        break;
      case 'atualizarTarefa':
        resultado = atualizarTarefa(dados.tarefa);
        break;
      case 'excluirTarefa':
        resultado = excluirTarefa(dados.id);
        break;
      case 'salvarPomodoro':
        resultado = salvarPomodoro(dados.pomodoro);
        break;
      case 'atualizarGamificacao':
        resultado = atualizarGamificacao(dados.gamificacao);
        break;
      default:
        resultado = {
          success: false,
          message: 'Ação desconhecida'
        };
    }
    
    return ContentService.createTextOutput(JSON.stringify(resultado))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Erro ao processar requisição: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
