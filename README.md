# produtivamente

Sistema de Produtividade para TDAH, combinando gestão de tarefas, monitoramento de bem-estar mental e gamificação, com interface adaptada especificamente para necessidades neurodivergentes.

## Visão Geral

O ProdutivaMente é um sistema integrado que ajuda pessoas com TDAH a gerenciar sua produtividade e bem-estar mental através de:

- **Check-ins diários** de humor e energia
- **Gestão de tarefas** adaptada para diferentes níveis de energia
- **Pomodoro adaptado** com tracking de interrupções
- **Interface com Modo TDAH** otimizada para reduzir sobrecarga cognitiva
- **Dashboard** para visualização de tendências e padrões

## Estrutura do Projeto

```
produtivamente/
├── index.html                  # Página principal
├── assets/                     # Recursos estáticos
│   ├── css/
│   │   ├── style.css           # Estilos principais
│   │   └── modo-tdah.css       # Estilos do Modo TDAH
│   ├── js/
│   │   ├── app.js              # Lógica principal
│   │   ├── checkin.js          # Módulo de Check-ins
│   │   ├── tarefas.js          # Módulo de Tarefas
│   │   ├── pomodoro.js         # Módulo de Pomodoro
│   │   └── dashboard.js        # Módulo de Dashboard
│   └── img/                    # Imagens e ícones
├── components/                 # Componentes HTML
├── google-scripts/             # Scripts para Google Apps Script
│   └── apps-script.js          # Script para integração com Google Sheets
└── docs/                       # Documentação
    ├── setup-guide.md          # Guia de configuração
    └── google-integration.md   # Guia de integração com Google
```

## Funcionalidades Implementadas

- ✅ **Check-ins de Humor e Energia**: Registro diário do estado mental
- ✅ **Gestão de Tarefas**: Criação, edição e conclusão de tarefas
- ✅ **Pomodoro Adaptado**: Timer personalizado com tracking de interrupções
- ✅ **Modo TDAH**: Interface otimizada para reduzir sobrecarga cognitiva
- ✅ **Dashboard Básico**: Visualização de tendências de humor, energia e produtividade
- ✅ **Gamificação Básica**: Sistema de XP e níveis

## Guia de Implementação

### 1. Configuração do GitHub

1. Crie uma conta no GitHub (se ainda não tiver)
2. Crie um novo repositório chamado "produtivamente"
3. Clone este repositório para sua máquina local ou use o GitHub Desktop

### 2. Upload dos Arquivos

1. Faça upload de todos os arquivos deste projeto para o repositório
2. Certifique-se de manter a estrutura de pastas

### 3. Configuração do GitHub Pages

1. Vá para as configurações do repositório
2. Role até a seção "GitHub Pages"
3. Selecione a branch "main" como fonte
4. Clique em "Save"
5. Aguarde alguns minutos e seu site estará disponível em `https://seu-usuario.github.io/produtivamente`

### 4. Configuração do Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Renomeie a planilha para "ProdutivaMente"
4. Anote o ID da planilha (a parte da URL entre `/d/` e `/edit`)

### 5. Configuração do Google Apps Script

1. Na planilha, vá para "Extensões" > "Apps Script"
2. Exclua o código padrão no editor
3. Copie e cole o conteúdo do arquivo `google-scripts/apps-script.js`
4. Substitua `SUBSTITUA_PELO_ID_DA_SUA_PLANILHA` pelo ID da sua planilha
5. Salve o projeto (Ctrl+S ou ⌘+S)
6. Renomeie o projeto para "ProdutivaMente"

### 6. Publicação do Web App

1. No editor do Apps Script, clique em "Implantar" > "Nova implantação"
2. Selecione "Web app" como tipo
3. Defina:
   - Descrição: "ProdutivaMente API"
   - Executar como: "Eu" (sua conta)
   - Quem tem acesso: "Qualquer pessoa"
4. Clique em "Implantar"
5. Autorize o aplicativo quando solicitado
6. Copie a URL do Web App fornecida

### 7. Configuração da Integração

1. Abra o arquivo `assets/js/app.js` no seu repositório
2. Localize a função `enviarParaGoogleSheets`
3. Substitua o comentário pela implementação real:

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

4. Substitua `SUA_URL_DO_WEB_APP_AQUI` pela URL do Web App que você copiou
5. Salve o arquivo e faça commit das alterações

### 8. Inicialização da Estrutura da Planilha

1. Acesse seu site publicado (`https://seu-usuario.github.io/produtivamente`)
2. Abra o console do navegador (F12 ou Ctrl+Shift+I ou ⌘+Option+I)
3. Execute o seguinte comando:

```javascript
fetch('SUA_URL_DO_WEB_APP_AQUI', {
    method: 'POST',
    body: JSON.stringify({
        action: 'criarEstrutura'
    })
}).then(response => response.json()).then(console.log);
```

4. Substitua `SUA_URL_DO_WEB_APP_AQUI` pela URL do seu Web App
5. Verifique se a estrutura foi criada na sua planilha Google

## Uso Local (Sem Integração Google)

Se preferir usar o sistema localmente sem integração com Google:

1. Baixe todos os arquivos para sua máquina
2. Abra o arquivo `index.html` em um navegador moderno
3. O sistema funcionará com armazenamento local do navegador
4. Use as funções de exportação/importação para backup dos dados

## Personalização

### Cores e Tema

Para personalizar as cores do sistema:

1. Edite o arquivo `assets/css/style.css`
2. Modifique as variáveis CSS no seletor `:root`

### Funcionalidades

Para adicionar ou modificar funcionalidades:

1. Cada módulo está em seu próprio arquivo JavaScript
2. Edite o arquivo correspondente à funcionalidade desejada

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Abrir issues para reportar bugs ou sugerir melhorias
2. Enviar pull requests com correções ou novas funcionalidades
3. Melhorar a documentação

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.
