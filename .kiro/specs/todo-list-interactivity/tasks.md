# Implementation Plan: Todo List Interactivity

## Overview

Transformar a Todo List estática em uma aplicação interativa completa usando JavaScript puro. A implementação segue a abordagem state-driven rendering: um array `tasks[]` em memória é a fonte de verdade, e qualquer evento do usuário (adicionar, deletar, marcar/desmarcar) atualiza o array, persiste no `sessionStorage` e chama `render()` para reconstruir o DOM.

## Tasks

- [x] 1. Criar `app.js` com estado, funções puras e persistência
  - [x] 1.1 Definir `STORAGE_KEY`, `STATIC_TASKS` e o array `tasks[]`
    - Criar o arquivo `app.js`
    - Declarar a constante `STORAGE_KEY = 'todo-tasks'`
    - Declarar `STATIC_TASKS` com as 5 tarefas que hoje estão hardcoded no HTML (preservando texto, categoria e estado `completed`)
    - Declarar `let tasks = []` como estado em memória
    - _Requirements: 4.3_

  - [x] 1.2 Implementar `loadState()`
    - Tentar ler e fazer `JSON.parse` de `sessionStorage[STORAGE_KEY]` dentro de `try/catch`
    - Validar que o resultado é um array e que cada item possui os campos `id`, `text`, `category` e `completed`
    - Retornar `STATIC_TASKS` em caso de falha no parse, dado inválido ou `sessionStorage` indisponível
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 1.3 Implementar `persist()`
    - Serializar `tasks` com `JSON.stringify` e gravar em `sessionStorage[STORAGE_KEY]` dentro de `try/catch`
    - Silenciar erros caso `sessionStorage` esteja indisponível (modo privado restrito)
    - _Requirements: 4.2_

  - [ ]* 1.4 Escrever teste de propriedade — Property 5: Round-trip de persistência
    - Criar `tests/property/taskList.property.test.js` com fast-check
    - **Property 5: Round-trip de persistência**
    - Para qualquer array de `TaskObject`, `persist()` seguido de `loadState()` deve retornar array equivalente ao original (mesmos `id`, `text`, `category`, `completed`)
    - **Validates: Requirements 4.1, 4.2**

  - [x] 1.5 Implementar `addTask(text, category)`
    - Rejeitar silenciosamente se `text.trim()` for vazio (retornar sem modificar `tasks`)
    - Gerar `id` com `crypto.randomUUID()` com fallback para `Date.now().toString() + Math.random()`
    - Criar `TaskObject` com `completed: false`, fazer push em `tasks`, chamar `persist()` e `render()`
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 1.6 Escrever teste de propriedade — Property 1: Adição de tarefa válida aumenta a lista
    - **Property 1: Adição de tarefa válida aumenta a lista**
    - Para qualquer `tasks[]` e qualquer `text` com `minLength: 1`, `addTask(text, category)` deve aumentar `tasks.length` em exatamente 1 e o novo item deve conter o `text` e `category` informados
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 1.7 Escrever teste de propriedade — Property 2: Texto em branco é rejeitado
    - **Property 2: Texto em branco é rejeitado**
    - Para qualquer string composta inteiramente de espaços em branco (incluindo string vazia), `addTask(text, category)` não deve alterar `tasks[]`
    - Usar `fc.stringMatching(/^\s*$/)` como gerador
    - **Validates: Requirements 1.3**

  - [x] 1.8 Implementar `deleteTask(id)`
    - Filtrar `tasks` removendo o item com o `id` correspondente
    - Chamar `persist()` e `render()`
    - _Requirements: 2.2, 2.3_

  - [ ]* 1.9 Escrever teste de propriedade — Property 3: Deleção remove exatamente a tarefa alvo
    - **Property 3: Deleção remove exatamente a tarefa alvo**
    - Para qualquer `tasks[]` com `minLength: 1`, `deleteTask(id)` deve reduzir `tasks.length` em 1 e nenhum item com aquele `id` deve permanecer
    - **Validates: Requirements 2.2, 2.3**

  - [x] 1.10 Implementar `toggleTask(id)`
    - Inverter o campo `completed` do item com o `id` correspondente
    - Chamar `persist()` e `render()`
    - _Requirements: 3.1_

  - [x] 1.11 Implementar `updateProgress()`
    - Calcular `done` (itens com `completed === true`) e `total` (`tasks.length`)
    - Atualizar `style.width` do `.progress-fill` com `(done / total) * 100` (ou `0` se `total === 0`)
    - Atualizar `.progress-label` com `"${done} de ${total} concluídas"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 1.12 Escrever teste de propriedade — Property 4: Progresso reflete o estado atual
    - **Property 4: Progresso reflete o estado atual**
    - Para qualquer `tasks[]` (incluindo array vazio), `updateProgress()` deve atualizar o DOM com `(done/total)*100` e o label `"X de Y concluídas"` correspondente ao estado atual
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 2. Implementar `render()` e `init()`
  - [x] 2.1 Implementar `render()`
    - Limpar o conteúdo de `ul.task-list`
    - Para cada `TaskObject` em `tasks`, criar um `<li class="task-item">` com:
      - `<label class="task-label">` contendo `<input type="checkbox">`, `<span class="checkmark">` e `<span class="task-text">`
      - `<span class="tag tag-{category}">` com o label correto (Trabalho / Pessoal / Estudo)
      - `<button class="delete-btn" data-id="{id}" aria-label="Deletar tarefa">&times;</button>`
    - Aplicar classe `completed` ao `<li>` se `task.completed === true`
    - Marcar o `<input type="checkbox">` como `checked` se `task.completed === true`
    - Chamar `updateProgress()` ao final
    - _Requirements: 2.1, 5.1, 5.2_

  - [ ]* 2.2 Escrever teste de propriedade — Property 6: Renderização correta de categoria, estado e controles
    - **Property 6: Renderização correta de categoria, estado e controles**
    - Para qualquer `tasks[]`, cada `<li>` renderizado deve: (a) conter a classe `tag-work`, `tag-personal` ou `tag-study` correspondente ao `category`; (b) ter a classe `completed` se e somente se `task.completed === true`; (c) conter um elemento com classe `.delete-btn`
    - **Validates: Requirements 2.1, 5.1, 5.2**

  - [x] 2.3 Implementar `init()`
    - Chamar `loadState()` e atribuir o resultado a `tasks`
    - Chamar `render()`
    - Registrar listener de `submit` no `#add-form`
    - Registrar listener de `click` na `ul.task-list` (event delegation) para `.delete-btn` e `input[type="checkbox"]`
    - Chamar `document.addEventListener('DOMContentLoaded', init)`
    - _Requirements: 1.2, 1.3, 1.5, 2.2, 4.1_

- [x] 3. Checkpoint — Verificar lógica de `app.js`
  - Garantir que todas as funções estão implementadas e integradas
  - Garantir que os testes de propriedade passam (se implementados)
  - Perguntar ao usuário se há dúvidas antes de prosseguir para as mudanças no HTML/CSS

- [x] 4. Atualizar `index.html`
  - [x] 4.1 Remover as tasks estáticas do `<ul class="task-list">`
    - Deixar o `<ul class="task-list">` vazio (o JS irá populá-lo via `render()`)
    - _Requirements: 4.3_

  - [x] 4.2 Adicionar o `Add_Form` entre `.progress-bar-wrapper` e `.task-list`
    - Inserir o elemento `<form class="add-form" id="add-form">` com `#task-input`, `#category-select` e `.add-btn` conforme especificado no design
    - _Requirements: 1.1, 5.4_

  - [x] 4.3 Remover o script inline e linkar `app.js`
    - Remover o bloco `<script>` inline existente
    - Adicionar `<script src="app.js"></script>` antes do `</body>`
    - _Requirements: 3.1_

- [x] 5. Atualizar `style.css`
  - [x] 5.1 Adicionar estilos para `.add-form` e seus elementos filhos
    - Estilizar `.add-form` com `display: flex`, `gap` e `margin-bottom` consistentes com o design existente
    - Estilizar `.add-input` e `.add-select` com bordas, `border-radius` e foco na paleta roxa
    - Estilizar `.add-btn` como botão primário na paleta roxa (`#6c63ff` / `#a78bfa`)
    - _Requirements: 5.4_

  - [x] 5.2 Adicionar estilos para `.delete-btn`
    - Estilizar `.delete-btn` como botão discreto (cor neutra em repouso, vermelho suave no hover)
    - Garantir que o botão não desloca o layout dos demais elementos do `task-item` (usar `flex-shrink: 0` e `margin-left`)
    - _Requirements: 5.3_

- [x] 6. Checkpoint final — Garantir que tudo está integrado
  - Garantir que todos os testes passam (se implementados)
  - Verificar que `index.html` carrega `app.js` corretamente e que o estado inicial é renderizado a partir de `STATIC_TASKS`
  - Verificar que adicionar, deletar e marcar/desmarcar tarefas funciona e persiste no `sessionStorage`
  - Perguntar ao usuário se há dúvidas antes de concluir

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental antes de avançar para a próxima camada
- Os testes de propriedade usam [fast-check](https://github.com/dubzzz/fast-check) com mínimo de 100 iterações por propriedade
- Os testes unitários complementam os testes de propriedade cobrindo casos concretos e condições de erro
