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
      'ID', 'Titulo', 'Descricao', 'Prazo', 'Status', 'Interesse', 'Energia_Necessaria', 'DataCriacao', 'XP_Valor'
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

/**
 * Busca todas as tarefas da planilha 'Tarefas_Master'.
 * @return {Array<Object>} Um array de objetos, onde cada objeto representa uma tarefa.
 *                         Retorna um array vazio em caso de erro.
 */
function getTarefas() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);
    
    // Pega todos os valores, incluindo o cabeçalho
    const allValues = sheet.getDataRange().getValues();

    if (allValues.length < 2) { // Se não há dados ou apenas o cabeçalho
      return [];
    }

    const headers = allValues[0].map(header => header.toString().trim()); // Limpa e guarda os cabeçalhos
    const tasks = [];

    // Começa do índice 1 para pular a linha de cabeçalho
    for (let i = 1; i < allValues.length; i++) {
      const row = allValues[i];
      const taskObject = {};
      for (let j = 0; j < headers.length; j++) {
        // Tratar datas para que não sejam apenas objetos Date genéricos se necessário,
        // mas para consistência com o que é salvo, manter como está pode ser ok.
        // Prazo e DataCriacao são colunas de data.
        if (headers[j] === 'Prazo' || headers[j] === 'DataCriacao') {
          taskObject[headers[j]] = row[j] ? new Date(row[j]).toISOString() : null;
        } else {
          taskObject[headers[j]] = row[j];
        }
      }
      tasks.push(taskObject);
    }
    return tasks;

  } catch (error) {
    Logger.log('Erro em getTarefas: ' + error.toString());
    return []; // Retorna array vazio em caso de erro, conforme decisão
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

/**
 * Salva uma nova tarefa na planilha 'Tarefas_Master'.
 * @param {object} dadosTarefa - Objeto contendo os dados da tarefa do frontend.
 * @param {string} dadosTarefa.titulo - O título da tarefa.
 * @param {string} [dadosTarefa.descricao] - A descrição da tarefa (opcional).
 * @param {string|Date} [dadosTarefa.prazo] - O prazo da tarefa (opcional).
 * @param {string} dadosTarefa.interesse - Nível de interesse na tarefa (e.g., "Alto", "Médio", "Baixo").
 * @param {string} dadosTarefa.energiaNecessaria - Nível de energia necessário (e.g., "Alta", "Média", "Baixa").
 * @return {object} Um objeto JSON indicando sucesso ou falha.
 */
function salvarTarefa(dadosTarefa) {
  try {
    // Validate required fields
    if (!dadosTarefa || !dadosTarefa.titulo) {
      Logger.log('Erro em salvarTarefa: Título não fornecido | Dados: ' + JSON.stringify(dadosTarefa));
      return { success: false, message: 'Título da tarefa é obrigatório.' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);

    const newUuid = Utilities.getUuid();
    const dataCriacao = new Date();

    let prazoFinal = '';
    if (dadosTarefa.prazo) {
      if (typeof dadosTarefa.prazo === 'string') {
        const parsedDate = new Date(dadosTarefa.prazo);
        // Check if date is valid after parsing. getTime() returns NaN for invalid dates.
        if (!isNaN(parsedDate.getTime())) {
          prazoFinal = parsedDate;
        } else {
          // Handle invalid date string if necessary, or leave as empty string
          Logger.log('Prazo em formato de string inválido: ' + dadosTarefa.prazo);
        }
      } else if (dadosTarefa.prazo instanceof Date) {
        prazoFinal = dadosTarefa.prazo;
      }
    }
    
    const statusPadrao = 'A Fazer';
    const xpPadrao = 20;

    sheet.appendRow([
      newUuid,
      dadosTarefa.titulo,
      dadosTarefa.descricao || '',
      prazoFinal,
      statusPadrao,
      dadosTarefa.interesse || '', // Ensure these exist or provide defaults
      dadosTarefa.energiaNecessaria || '', // Ensure these exist or provide defaults
      dataCriacao,
      xpPadrao
    ]);

    return { success: true, message: 'Tarefa salva com sucesso!', tarefaId: newUuid };

  } catch (error) {
    Logger.log('Erro em salvarTarefa: ' + error.toString() + ' | Dados: ' + JSON.stringify(dadosTarefa));
    return { success: false, message: 'Erro ao salvar tarefa: ' + error.message }; // Use error.message for a cleaner message to client
  }
}

/**
 * Atualiza campos específicos de uma tarefa existente na planilha 'Tarefas_Master'.
 * @param {string} idTarefa - O ID da tarefa a ser atualizada.
 * @param {object} dadosParaAtualizar - Um objeto contendo os campos da tarefa a serem atualizados.
 * @param {string} [dadosParaAtualizar.titulo] - Novo título da tarefa.
 * @param {string} [dadosParaAtualizar.descricao] - Nova descrição da tarefa.
 * @param {string|Date} [dadosParaAtualizar.prazo] - Novo prazo da tarefa.
 * @param {string} [dadosParaAtualizar.status] - Novo status da tarefa.
 * @param {string} [dadosParaAtualizar.interesse] - Novo nível de interesse.
 * @param {string} [dadosParaAtualizar.energiaNecessaria] - Novo nível de energia necessária.
 * @return {object} Um objeto JSON indicando sucesso ou falha.
 */
function atualizarTarefa(idTarefa, dadosParaAtualizar) {
  try {
    if (!idTarefa || !dadosParaAtualizar || Object.keys(dadosParaAtualizar).length === 0) {
      Logger.log('Erro em atualizarTarefa: ID da tarefa ou dados para atualizar não fornecidos ou vazios. ID: ' + idTarefa + ', Dados: ' + JSON.stringify(dadosParaAtualizar));
      return { success: false, message: 'ID da tarefa e dados para atualizar são obrigatórios.' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);
    const allValues = sheet.getDataRange().getValues();

    let rowIndex = -1;
    for (let i = 1; i < allValues.length; i++) { // Start from 1 to skip header
      if (allValues[i][0] === idTarefa) { // Column 0 is 'ID'
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: 'Tarefa não encontrada.' };
    }

    const sheetRowNumber = rowIndex + 1; // Sheet rows are 1-based

    // Column mapping (1-based for getRange)
    // Based on 'ID', 'Titulo', 'Descricao', 'Prazo', 'Status', 'Interesse', 'Energia_Necessaria', 'DataCriacao', 'XP_Valor'
    const columnMap = {
      'titulo': 2, // 'Titulo'
      'descricao': 3, // 'Descricao'
      'prazo': 4, // 'Prazo'
      'status': 5, // 'Status'
      'interesse': 6, // 'Interesse'
      'energiaNecessaria': 7 // 'Energia_Necessaria'
      // 'DataCriacao' (column 8) and 'XP_Valor' (column 9) are generally not updated here.
    };

    let updated = false;
    for (const key in dadosParaAtualizar) {
      if (dadosParaAtualizar.hasOwnProperty(key) && columnMap[key.toLowerCase()]) { // Ensure key matching is case-insensitive for safety or standardize keys
        let valueToSet = dadosParaAtualizar[key];
        const mappedKey = key.toLowerCase(); // Use a consistent key for map lookup

        if (mappedKey === 'prazo') {
          if (valueToSet) {
            const parsedDate = new Date(valueToSet);
            if (!isNaN(parsedDate.getTime())) {
              valueToSet = parsedDate;
            } else {
              Logger.log('Erro em atualizarTarefa: Formato de prazo inválido para ' + key + ': ' + valueToSet + ' | ID: ' + idTarefa);
              continue; // Skip updating this field if date is invalid
            }
          } else {
            valueToSet = ''; // Allow clearing the prazo
          }
        }
        sheet.getRange(sheetRowNumber, columnMap[mappedKey]).setValue(valueToSet);
        updated = true;
      }
    }
    
    if (!updated && Object.keys(dadosParaAtualizar).length > 0) {
        // This condition checks if any valid fields were provided for update.
        // If dadosParaAtualizar contains only invalid keys, 'updated' will be false.
        let validKeysFound = false;
        for (const key in dadosParaAtualizar) {
            if (columnMap[key.toLowerCase()]) {
                validKeysFound = true;
                break;
            }
        }
        if (!validKeysFound) { // Only return error if no valid keys were in dadosParaAtualizar
            Logger.log('Erro em atualizarTarefa: Nenhum campo válido para atualização fornecido. ID: ' + idTarefa + ', Dados: ' + JSON.stringify(dadosParaAtualizar));
            return { success: false, message: 'Nenhum campo válido para atualização fornecido nos dados.'};
        }
    }

    return { success: true, message: 'Tarefa atualizada com sucesso!' };

  } catch (error) {
    Logger.log('Erro em atualizarTarefa: ' + error.toString() + ' | ID: ' + idTarefa + ', Dados: ' + JSON.stringify(dadosParaAtualizar));
    return { success: false, message: 'Erro ao atualizar tarefa: ' + error.message };
  }
}

/**
 * Exclui uma tarefa da planilha 'Tarefas_Master' com base no ID.
 * @param {string} idTarefa - O ID da tarefa a ser excluída.
 * @return {object} Um objeto JSON indicando sucesso ou falha.
 */
function excluirTarefa(idTarefa) {
  try {
    if (!idTarefa) {
      Logger.log('Erro em excluirTarefa: ID da tarefa não fornecido.');
      return { success: false, message: 'ID da tarefa é obrigatório para exclusão.' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEETS.TAREFAS);
    const allValues = sheet.getDataRange().getValues();
    let rowIndexFound = -1;

    for (let i = 1; i < allValues.length; i++) { // Start from 1 to skip header
      if (allValues[i][0] === idTarefa) { // Column 0 is 'ID'
        rowIndexFound = i;
        break;
      }
    }

    if (rowIndexFound === -1) {
      return { success: false, message: 'Tarefa não encontrada.' };
    }

    sheet.deleteRow(rowIndexFound + 1); // sheet.deleteRow is 1-based index

    return { success: true, message: 'Tarefa excluída com sucesso!' };

  } catch (error) {
    Logger.log('Erro em excluirTarefa: ' + error.toString() + ' | ID: ' + idTarefa);
    return { success: false, message: 'Erro ao excluir tarefa: ' + error.message };
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

// Function to open the Check-in dialog
function abrirDialogoCheckin() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('Checkin')
      .setWidth(450)
      .setHeight(550);
  // The method to display this depends on the context (e.g., Google Sheets, Docs, etc.)
  // For example, in Google Sheets, you might use:
  // SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Check-in Diário');
  // Since the exact display method isn't specified for "Code.gs", 
  // just returning the HtmlOutput object is the core part for HtmlService.
  // However, the user's request implies this function itself should make it appear.
  // Let's assume a generic way to make it usable in common Apps Script contexts.
  // If this script is bound to a GSheet, GDoc, GSlides, this will work:
  try {
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Check-in Diário');
  } catch (e) {
    try {
      DocumentApp.getUi().showModalDialog(htmlOutput, 'Check-in Diário');
    } catch (e2) {
      try {
        SlidesApp.getUi().showModalDialog(htmlOutput, 'Check-in Diário');
      } catch (e3) {
        // If not in a GSheet/GDoc/GSlides context, this might be called from a web app's server-side function
        // or another context where direct UI display isn't done this way.
        // For now, we'll primarily support the common document-bound script case.
        // Throwing an error if no UI context is found might be too much,
        // as HtmlService.createHtmlOutputFromFile itself is the core request.
        // The user might call this from doPost/doGet and return htmlOutput.
        // For now, let's just prepare the output and let the calling context handle display if direct .showModalDialog fails.
        // The original request was just "use HtmlService.createHtmlOutputFromFile('Checkin').setWidth(450).setHeight(550);"
        // So, the core is just returning the output.
        // However, the user also said "Ele será uma caixa de diálogo funcional imediata."
        // This implies the function should try to show it.
        // The most robust way if we don't know the context is to return it and let the caller show it.
        // But to fulfil "caixa de diálogo funcional imediata", we should try common methods.
        Logger.log("Could not show dialog directly. Context (Spreadsheet/Document/Slides) not detected or UI unavailable. Returning HTMLOutput object.");
        // The original request was just to create the output. The prompt was:
        // "Dentro dela, use HtmlService.createHtmlOutputFromFile('Checkin').setWidth(450).setHeight(550); para criar a saída HTML."
        // This does not say to *show* it. It says "para *criar* a saída HTML".
        // So, simply returning it is correct based on that specific line.
      }
    }
  }
  return htmlOutput; // Returning it is important if the try-catches fail or if it's used in a web app.
}

/**
 * Retorna o conteúdo HTML para uma view específica.
 * @param {string} viewName O nome do arquivo HTML da view (sem a extensão .html).
 * @return {string} O conteúdo HTML da view.
 */
function getHtmlForView(viewName) {
  try {
    // Lista de views permitidas para segurança
    const allowedViews = ['Checkin', 'Tarefas', 'Pomodoro', 'Habitos', 'Reflexoes', 'Sos', 'Configuracoes', 'VisaoGeral'];
    // O nome do arquivo HTML deve ser capitalizado se o viewName vier em minúsculas do data-view
    const fileName = viewName.charAt(0).toUpperCase() + viewName.slice(1);

    if (viewName.toLowerCase() === 'visao-geral') { 
      // Placeholder para o conteúdo do dashboard principal
      return '<h1>Visão Geral do ProdutivaMente</h1><p>Aqui aparecerão seus resumos e KPIs principais.</p>';
    }

    if (allowedViews.map(v => v.toLowerCase()).includes(viewName.toLowerCase())) {
      // Assumes viewName corresponds to an HTML file name (e.g., "Checkin" for "Checkin.html")
      // These files are expected to be at the root of the Apps Script project
      // (which means directly inside the `rootDir` if one is specified in .clasp.json, e.g. 'google-scripts/')
      return HtmlService.createHtmlOutputFromFile(fileName).getContent();
    } else {
      Logger.log('Tentativa de acesso a view não permitida: ' + viewName);
      throw new Error('View não permitida: ' + viewName);
    }
  } catch (e) {
    Logger.log('Erro em getHtmlForView(' + viewName + '): ' + e.toString());
    return '<h2>Erro ao carregar o módulo: ' + viewName + '</h2><p>' + e.message + '</p>';
  }
}

// Configurar Web App para receber requisições do frontend
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('ProdutivaMente Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1'); // Para responsividade
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

/**
 * Adds a custom menu to the Google Sheet UI when the spreadsheet is opened.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createMenu('🚀 ProdutivaMente')
      .addItem('🌟 Abrir Check-in Diário', 'abrirDialogoCheckin')
      .addToUi();
}
