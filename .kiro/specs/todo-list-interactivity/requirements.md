# Requirements Document

## Introduction

Esta feature adiciona interatividade completa à Todo List existente (HTML/CSS com JS inline básico). O objetivo é permitir que o usuário adicione novas tarefas com texto e categoria, delete tarefas individualmente, e tenha o estado da lista persistido via `sessionStorage` — de modo que recarregar a página não perca as tarefas da sessão atual. O JS inline existente (que atualiza a barra de progresso ao marcar/desmarcar) deve ser integrado e expandido, sem quebrar o visual atual.

## Glossary

- **Todo_App**: O sistema de gerenciamento de tarefas implementado no `index.html`.
- **Task**: Um item de tarefa composto por texto, categoria e estado de conclusão (concluída ou pendente).
- **Task_List**: A lista `<ul class="task-list">` que exibe todas as Tasks.
- **Add_Form**: O formulário de entrada composto por um campo de texto e um seletor de categoria para criação de novas Tasks.
- **Delete_Button**: O botão associado a cada Task que permite removê-la da Task_List.
- **Progress_Bar**: O componente visual que exibe a proporção de Tasks concluídas em relação ao total.
- **Session_Storage**: O mecanismo `sessionStorage` do navegador usado para persistir o estado da Task_List durante a sessão.
- **Category**: A classificação de uma Task, podendo ser `Trabalho`, `Pessoal` ou `Estudo`.

---

## Requirements

### Requirement 1: Adicionar nova tarefa

**User Story:** Como usuário, quero digitar o texto de uma nova tarefa e escolher sua categoria, para que eu possa incluir itens à minha lista sem editar o HTML manualmente.

#### Acceptance Criteria

1. THE Add_Form SHALL conter um campo de texto e um seletor de Category visíveis na interface.
2. WHEN o usuário submete o Add_Form com o campo de texto preenchido, THE Todo_App SHALL criar uma nova Task com o texto informado, a Category selecionada e estado inicial pendente, e adicioná-la ao final da Task_List.
3. WHEN o usuário submete o Add_Form com o campo de texto vazio, THE Todo_App SHALL impedir a criação da Task e manter o foco no campo de texto.
4. WHEN uma nova Task é adicionada à Task_List, THE Add_Form SHALL limpar o campo de texto e manter a Category selecionada anteriormente.
5. WHEN o usuário pressiona a tecla Enter com o campo de texto em foco, THE Todo_App SHALL submeter o Add_Form com o mesmo comportamento dos critérios 2 e 3.

---

### Requirement 2: Deletar tarefa

**User Story:** Como usuário, quero remover uma tarefa da lista, para que eu possa eliminar itens que não são mais relevantes.

#### Acceptance Criteria

1. THE Todo_App SHALL exibir um Delete_Button em cada Task da Task_List.
2. WHEN o usuário aciona o Delete_Button de uma Task, THE Todo_App SHALL remover essa Task da Task_List imediatamente.
3. WHEN uma Task é removida da Task_List, THE Progress_Bar SHALL ser atualizada para refletir o novo total e o novo número de Tasks concluídas.

---

### Requirement 3: Atualização da barra de progresso

**User Story:** Como usuário, quero que a barra de progresso reflita sempre o estado atual da lista, para que eu tenha uma visão clara do meu avanço.

#### Acceptance Criteria

1. WHEN o estado de conclusão de qualquer Task é alterado, THE Progress_Bar SHALL exibir a porcentagem de Tasks concluídas em relação ao total de Tasks presentes na Task_List.
2. WHEN uma Task é adicionada à Task_List, THE Progress_Bar SHALL ser recalculada com base no novo total.
3. WHEN uma Task é removida da Task_List, THE Progress_Bar SHALL ser recalculada com base no novo total.
4. WHILE a Task_List não contém nenhuma Task, THE Progress_Bar SHALL exibir 0% e o label SHALL exibir "0 de 0 concluídas".

---

### Requirement 4: Persistência via sessionStorage

**User Story:** Como usuário, quero que minhas tarefas sejam mantidas ao recarregar a página, para que eu não perca o trabalho da sessão atual.

#### Acceptance Criteria

1. WHEN o usuário recarrega a página, THE Todo_App SHALL restaurar a Task_List com todas as Tasks salvas na Session_Storage, preservando texto, Category e estado de conclusão de cada Task.
2. WHEN qualquer alteração ocorre na Task_List (adição, remoção ou mudança de estado de conclusão de uma Task), THE Todo_App SHALL persistir o estado completo da Task_List na Session_Storage.
3. WHEN a Session_Storage não contém dados da Task_List, THE Todo_App SHALL carregar as Tasks estáticas definidas no HTML como estado inicial.
4. IF a Session_Storage contiver dados corrompidos ou inválidos, THEN THE Todo_App SHALL ignorar os dados corrompidos e carregar as Tasks estáticas definidas no HTML.

---

### Requirement 5: Compatibilidade com o design existente

**User Story:** Como desenvolvedor, quero que as novas funcionalidades respeitem o design visual atual, para que a experiência do usuário permaneça consistente.

#### Acceptance Criteria

1. THE Todo_App SHALL aplicar a classe CSS `tag-work`, `tag-personal` ou `tag-study` à tag de Category de cada Task de acordo com a Category selecionada.
2. THE Todo_App SHALL aplicar a classe CSS `completed` ao elemento `<li>` de cada Task cujo estado de conclusão seja concluída.
3. THE Delete_Button SHALL ser estilizado de forma consistente com o design existente (paleta de cores roxas/neutras) e não SHALL deslocar o layout dos demais elementos da Task.
4. THE Add_Form SHALL ser estilizado de forma consistente com o design existente e posicionado entre o Progress_Bar e a Task_List.
