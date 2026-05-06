# Design Document

## Overview

Esta feature transforma a Todo List estática em uma aplicação interativa completa, mantendo o design visual existente (paleta roxa, cards arredondados, animações CSS). As mudanças se concentram em três camadas:

1. **HTML**: adição do `Add_Form` entre a `Progress_Bar` e a `Task_List`; adição de `Delete_Button` em cada `task-item`; remoção das tasks estáticas do HTML (passam a ser gerenciadas pelo JS).
2. **CSS**: estilos para o `Add_Form` e o `Delete_Button`, integrados à paleta existente.
3. **JavaScript**: módulo único (`app.js`) que substitui o script inline, gerenciando estado em memória, renderizando o DOM e sincronizando com `sessionStorage`.

A abordagem é **state-driven rendering**: o JS mantém um array de objetos `Task` como fonte de verdade e re-renderiza a `Task_List` sempre que o estado muda. Isso simplifica a sincronização com `sessionStorage` e elimina a necessidade de ler o DOM para calcular progresso.

---

## Architecture

```mermaid
flowchart TD
    subgraph Browser
        HTML[index.html\nAdd_Form + Task_List skeleton]
        CSS[style.css\nestilos existentes + novos]
        JS[app.js\nmódulo principal]
    end

    subgraph State
        MEM[tasks[]\narray em memória]
        SS[sessionStorage\n'todo-tasks']
    end

    subgraph DOM
        FORM[Add_Form]
        LIST[Task_List ul]
        PROG[Progress_Bar]
    end

    HTML --> JS
    JS --> MEM
    MEM --> SS
    MEM --> DOM
    FORM -- submit/Enter --> JS
    LIST -- checkbox change --> JS
    LIST -- delete click --> JS
```

**Fluxo de dados:**
1. Na inicialização, `app.js` tenta carregar o estado do `sessionStorage`; se ausente ou inválido, usa as tasks estáticas definidas como constante no próprio JS.
2. Qualquer evento do usuário (adicionar, deletar, marcar/desmarcar) atualiza o array `tasks[]`, persiste no `sessionStorage` e chama `render()`.
3. `render()` reconstrói o conteúdo da `Task_List` e atualiza a `Progress_Bar` a partir do array.

---

## Components and Interfaces

### `Add_Form` (HTML + CSS)

Posicionado entre `.progress-bar-wrapper` e `.task-list`. Estrutura:

```html
<form class="add-form" id="add-form">
  <input
    type="text"
    id="task-input"
    class="add-input"
    placeholder="Nova tarefa..."
    autocomplete="off"
  />
  <select id="category-select" class="add-select">
    <option value="work">Trabalho</option>
    <option value="personal">Pessoal</option>
    <option value="study">Estudo</option>
  </select>
  <button type="submit" class="add-btn" aria-label="Adicionar tarefa">+</button>
</form>
```

### `Delete_Button` (por task)

Inserido dentro de cada `<li class="task-item">`, após a tag de categoria:

```html
<button class="delete-btn" aria-label="Deletar tarefa" data-id="<id>">
  &times;
</button>
```

### `app.js` — Interfaces internas

```
TaskObject {
  id:        string   // crypto.randomUUID() ou Date.now().toString()
  text:      string   // descrição da tarefa
  category:  'work' | 'personal' | 'study'
  completed: boolean
}

STORAGE_KEY = 'todo-tasks'

STATIC_TASKS: TaskObject[]   // tasks iniciais hardcoded (substitui o HTML estático)

tasks: TaskObject[]           // estado em memória

init()         → carrega estado inicial e chama render()
render()       → reconstrói Task_List e atualiza Progress_Bar
addTask(text, category) → cria TaskObject, push em tasks, persist, render
deleteTask(id) → filtra tasks, persist, render
toggleTask(id) → inverte completed, persist, render
persist()      → JSON.stringify(tasks) → sessionStorage[STORAGE_KEY]
loadState()    → tenta JSON.parse; retorna STATIC_TASKS em caso de falha
updateProgress() → calcula done/total, atualiza DOM
```

---

## Data Models

### `TaskObject`

| Campo       | Tipo                              | Descrição                                      |
|-------------|-----------------------------------|------------------------------------------------|
| `id`        | `string`                          | Identificador único gerado na criação          |
| `text`      | `string`                          | Texto descritivo da tarefa (não vazio)         |
| `category`  | `'work' \| 'personal' \| 'study'` | Categoria da tarefa                            |
| `completed` | `boolean`                         | `true` se concluída, `false` se pendente       |

### Mapeamento de categoria → CSS

| Valor `category` | Classe da tag | Label exibido |
|------------------|---------------|---------------|
| `'work'`         | `tag-work`    | Trabalho      |
| `'personal'`     | `tag-personal`| Pessoal       |
| `'study'`        | `tag-study`   | Estudo        |

### `sessionStorage` schema

```json
[
  {
    "id": "1715000000000",
    "text": "Revisar o relatório mensal",
    "category": "work",
    "completed": true
  }
]
```

Chave: `"todo-tasks"`. Valor: array JSON de `TaskObject`. Qualquer erro de parse descarta os dados e usa `STATIC_TASKS`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Adição de tarefa válida aumenta a lista

*Para qualquer* lista de tarefas e qualquer texto não-vazio, adicionar uma nova tarefa deve resultar no comprimento da lista crescendo exatamente em 1, e a nova tarefa deve estar presente na lista com o texto e categoria informados.

**Validates: Requirements 1.2, 1.4**

---

### Property 2: Texto em branco é rejeitado

*Para qualquer* string composta inteiramente de espaços em branco (incluindo string vazia), tentar adicionar uma tarefa com esse texto deve ser rejeitado e a lista deve permanecer inalterada.

**Validates: Requirements 1.3**

---

### Property 3: Deleção remove exatamente a tarefa alvo

*Para qualquer* lista de tarefas com pelo menos um item, deletar uma tarefa pelo seu `id` deve resultar em uma lista com comprimento reduzido em 1, e nenhum item com aquele `id` deve permanecer na lista.

**Validates: Requirements 2.2, 2.3**

---

### Property 4: Progresso reflete o estado atual

*Para qualquer* estado da lista de tarefas (incluindo lista vazia), a porcentagem exibida na `Progress_Bar` deve ser igual a `(concluídas / total) * 100`, e o label deve exibir `"X de Y concluídas"` onde X e Y correspondem ao estado atual.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 5: Round-trip de persistência

*Para qualquer* estado da lista de tarefas, serializar para `sessionStorage` e depois desserializar deve produzir um array equivalente ao original, preservando `id`, `text`, `category` e `completed` de cada tarefa.

**Validates: Requirements 4.1, 4.2**

---

### Property 6: Renderização correta de categoria, estado e controles

*Para qualquer* array de tarefas, cada item renderizado no DOM deve: (a) conter exatamente a classe CSS de categoria correspondente ao seu campo `category` (`tag-work`, `tag-personal` ou `tag-study`); (b) ter a classe `completed` no `<li>` se e somente se `task.completed === true`; e (c) conter um `Delete_Button` com classe `.delete-btn`.

**Validates: Requirements 2.1, 5.1, 5.2**

---

## Error Handling

| Cenário | Comportamento esperado |
|---|---|
| `sessionStorage` com JSON inválido | `try/catch` no parse; fallback para `STATIC_TASKS` |
| `sessionStorage` com array de objetos malformados (campos ausentes) | Validação de schema após parse; fallback para `STATIC_TASKS` |
| `sessionStorage` indisponível (modo privado restrito) | `try/catch` no acesso; app funciona sem persistência |
| Submissão de texto vazio/whitespace | Prevenção no handler de submit; foco retorna ao input |
| `crypto.randomUUID` indisponível | Fallback para `Date.now().toString() + Math.random()` |
| Deleção de `id` inexistente | `filter` não altera a lista; nenhum erro visível |

---

## Testing Strategy

### Abordagem dual

A estratégia combina **testes de exemplo** (casos concretos e condições de erro) com **testes baseados em propriedades** (cobertura ampla de inputs via geração aleatória).

### Testes de exemplo (unit tests)

Focados em:
- Comportamento específico do formulário (submit com Enter, submit com botão)
- Renderização correta de cada categoria no DOM
- Estado inicial quando `sessionStorage` está vazio
- Fallback quando `sessionStorage` contém dados corrompidos
- Classe `completed` aplicada corretamente ao `<li>`

### Testes baseados em propriedades (property-based tests)

**Biblioteca recomendada:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript/TypeScript, amplamente adotada, sem dependências de framework).

Cada propriedade do design deve ser implementada como um teste com **mínimo de 100 iterações**.

| Propriedade do design | Geradores fast-check sugeridos |
|---|---|
| Property 1 (adição válida) | `fc.array(taskArb)`, `fc.string({ minLength: 1 })`, `fc.constantFrom('work','personal','study')` |
| Property 2 (texto em branco rejeitado) | `fc.stringMatching(/^\s*$/)` |
| Property 3 (deleção remove alvo) | `fc.array(taskArb, { minLength: 1 })`, `fc.nat()` para índice |
| Property 4 (progresso correto) | `fc.array(taskArb)` com `completed` variável |
| Property 5 (round-trip sessionStorage) | `fc.array(taskArb)` |
| Property 6 (renderização: categoria, completed, delete-btn) | `fc.array(taskArb)`, `fc.constantFrom('work','personal','study')` |

**Tag format para cada teste:**
```
// Feature: todo-list-interactivity, Property N: <texto da propriedade>
```

### Estrutura de arquivos de teste sugerida

```
tests/
  unit/
    addTask.test.js
    deleteTask.test.js
    toggleTask.test.js
    render.test.js
    loadState.test.js
  property/
    taskList.property.test.js   ← todas as 6 propriedades
```
