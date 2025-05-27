# Guia Detalhado de Configuração do Google Sheets e Apps Script

Este guia fornece instruções passo a passo para configurar a integração do ProdutivaMente com o Google Sheets e Google Apps Script.

## 1. Criação da Planilha Google

### 1.1. Acesse o Google Sheets
1. Vá para [sheets.google.com](https://sheets.google.com)
2. Faça login com sua conta Google

### 1.2. Crie uma Nova Planilha
1. Clique no botão "+ Novo" no canto superior esquerdo
2. Selecione "Planilha Google"

### 1.3. Renomeie a Planilha
1. Clique no título "Planilha sem título" no topo
2. Digite "ProdutivaMente" e pressione Enter

### 1.4. Obtenha o ID da Planilha
1. Observe a URL no navegador
2. O ID da planilha é a sequência de caracteres entre `/d/` e `/edit`
3. Por exemplo, em `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v/edit`, o ID é `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v`
4. Copie este ID para uso posterior

## 2. Configuração do Google Apps Script

### 2.1. Abra o Editor de Script
1. Na sua planilha, clique em "Extensões" no menu superior
2. Selecione "Apps Script"
3. Um novo guia será aberto com o editor de script

### 2.2. Configure o Script
1. Exclua todo o código padrão no editor
2. Copie e cole o conteúdo do arquivo `google-scripts/apps-script.js` do projeto ProdutivaMente
3. Na linha 5, substitua `SUBSTITUA_PELO_ID_DA_SUA_PLANILHA` pelo ID da sua planilha que você copiou anteriormente
4. Deve ficar assim: `SHEET_ID: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v',`

### 2.3. Salve o Projeto
1. Clique no ícone de disquete ou pressione Ctrl+S (ou ⌘+S no Mac)
2. Na caixa de diálogo, digite "ProdutivaMente" como nome do projeto
3. Clique em "Salvar"

## 3. Publicação do Web App

### 3.1. Prepare a Implantação
1. No editor do Apps Script, clique no botão "Implantar" no canto superior direito
2. Selecione "Nova implantação"

### 3.2. Configure a Implantação
1. Clique no ícone de engrenagem (⚙️) ao lado de "Selecionar tipo"
2. Escolha "Web app"
3. Preencha os campos:
   - Descrição: "ProdutivaMente API"
   - Executar como: "Eu" (sua conta)
   - Quem tem acesso: "Qualquer pessoa"
4. Clique em "Implantar"

### 3.3. Autorize o Aplicativo
1. Uma caixa de diálogo de autorização será exibida
2. Clique em "Autorizar acesso"
3. Selecione sua conta Google
4. Você verá um aviso de "App não verificado"
5. Clique em "Avançado" e depois em "Acessar [nome do seu projeto] (não seguro)"
6. Clique em "Permitir"

### 3.4. Obtenha a URL do Web App
1. Após a autorização, você verá uma mensagem de sucesso
2. Copie a URL do Web App fornecida
3. Esta URL será usada para conectar o frontend ao Google Sheets
4. Deve ser algo como `https://script.google.com/macros/s/AKfycbz1234567890abcdefghijklmnopqrstuvwxyz/exec`

## 4. Teste da Integração

### 4.1. Inicialize a Estrutura da Planilha
1. Abra o console do navegador (F12 ou Ctrl+Shift+I)
2. Cole e execute o seguinte código, substituindo pela sua URL:

```javascript
fetch('SUA_URL_DO_WEB_APP_AQUI', {
    method: 'POST',
    body: JSON.stringify({
        action: 'criarEstrutura'
    })
}).then(response => response.json()).then(console.log);
```

3. Verifique sua planilha Google - agora deve ter 4 abas: CheckIns_Diarios, Tarefas_Master, Pomodoro_Sessions e Gamificacao_Stats

### 4.2. Teste um Check-in
1. No console do navegador, execute:

```javascript
fetch('SUA_URL_DO_WEB_APP_AQUI', {
    method: 'POST',
    body: JSON.stringify({
        action: 'salvarCheckin',
        checkin: {
            data: new Date().toISOString(),
            humor: 4,
            energia: 3,
            sono: 7,
            medicacao: 'Sim',
            observacoes: 'Teste de integração'
        }
    })
}).then(response => response.json()).then(console.log);
```

2. Verifique a aba CheckIns_Diarios na sua planilha - deve haver um novo registro

## 5. Integração com o Frontend

### 5.1. Edite o Arquivo app.js
1. No seu repositório GitHub, navegue até o arquivo `assets/js/app.js`
2. Clique no arquivo para abri-lo
3. Clique no botão de edição (ícone de lápis)
4. Localize a função `enviarParaGoogleSheets` (aproximadamente linha 150)
5. Substitua a implementação atual pela versão completa:

```javascript
async function enviarParaGoogleSheets(tipo, dados) {
    try {
        const response = await fetch('SUA_URL_DO_WEB_APP_AQUI', {
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
```

6. Substitua `SUA_URL_DO_WEB_APP_AQUI` pela URL do Web App que você copiou
7. Clique em "Commit changes" para salvar

### 5.2. Teste a Aplicação Completa
1. Acesse seu site publicado no GitHub Pages
2. Faça um check-in de teste
3. Verifique se os dados aparecem na sua planilha Google

## 6. Solução de Problemas Comuns

### 6.1. Erro de CORS
Se você encontrar erros de CORS no console:
1. Verifique se a URL do Web App está correta
2. Certifique-se de que configurou "Quem tem acesso" como "Qualquer pessoa"
3. Reimplante o Web App e obtenha uma nova URL

### 6.2. Erro de Autorização
Se você encontrar erros de autorização:
1. Abra a URL do Web App diretamente no navegador
2. Autorize novamente o aplicativo
3. Tente a integração novamente

### 6.3. Dados Não Aparecem na Planilha
Se os dados não aparecerem na planilha:
1. Verifique o console do navegador para erros
2. Certifique-se de que o ID da planilha está correto no script
3. Verifique se as abas da planilha têm os nomes exatos: CheckIns_Diarios, Tarefas_Master, etc.

## 7. Backup e Restauração de Dados

### 7.1. Exportação de Dados
Para fazer backup dos dados:
1. No aplicativo ProdutivaMente, use a função `exportarDados()` no console do navegador
2. Um arquivo JSON será baixado com todos os dados

### 7.2. Importação de Dados
Para restaurar dados de um backup:
1. Use a função `importarDados(jsonString)` no console do navegador
2. Substitua `jsonString` pelo conteúdo do arquivo de backup

## 8. Próximos Passos

Após configurar com sucesso a integração:
1. Personalize o aplicativo conforme necessário
2. Considere adicionar mais funcionalidades
3. Compartilhe o link do GitHub Pages com usuários para testes
4. Colete feedback e faça melhorias
