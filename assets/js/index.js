import StateManager from './state.js';

// const STORAGE_KEY = "glistApp";
const newListContainer = document.getElementById('new-list-container');
const listsContainer = document.getElementById('lists-container');
const hiddenGlistsDropdown = document.getElementById('archived-lists');
const hiddenGlistsToggle = document.getElementById('archived-lists-toggle');
const deleteCompletedTasksBtn = document.getElementById('delete-completed-tasks-btn');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('navbarSupportedContent');

setUpToggle(mobileMenuToggle, mobileMenu);

function setUpToggle(toggler, toggled) {
  toggler.addEventListener('click', function(e) {
    e.preventDefault();
    toggled.classList.toggle('show');
  });
}

// StateManager encapsulates state management logic
let state = StateManager.load();

function renderGlists(state) {
  listsContainer.innerHTML = "";

  const glists = state.glists.allIds
    .map(id => state.glists.byId[id])
    .filter(g => !g.archived)
    .sort((a, b) => a.order - b.order);

  if (glists.length === 0) {
    listsContainer.innerHTML = `
      <div class="list-container">
        <div class="list-header">
          <h3>Your Lists</h3>
        </div>
        <div class="font-weight-normal task-container">
          All lists you create will show up on this page.
          Click the plus sign in the navbar above to get started.
        </div>
      </div>
    `;
    return;
  }

  glists.forEach(glist => {
    listsContainer.insertAdjacentHTML("beforeend", renderGlist(glist, state));
  });

  // Refresh hidden glists dropdown
  if (hiddenGlistsDropdown) {
    const archivedGlists = state.glists.allIds
      .map(id => state.glists.byId[id])
      .filter(glist => glist.archived);

      if (archivedGlists.length > 0) {
        hiddenGlistsToggle.classList.remove('hidden');

        archivedGlists.forEach(glist => {
          let archivedItem = document.createElement('button');
          archivedItem.classList.add('dropdown-item');
          archivedItem.setAttribute('data-list', glist.id);
          archivedItem.innerText = escapeHTML(glist.name);
          archivedItem.addEventListener('click', function() {
            unarchiveGlist(glist.id);
          });
          
          hiddenGlistsDropdown.appendChild(archivedItem);
        });
      }
      
      else {
        hiddenGlistsDropdown.classList.remove('show');
        hiddenGlistsDropdown.innerHTML = '';
        hiddenGlistsToggle.classList.add('hidden');
      }
  }
}

function renderGlist(glist, state) {
  const tasks = getTasksForGlist(state, glist.id);

  return `
    <div class="list-container" id="glist-container_${glist.id}" draggable="true">
      <div class="list-header">

        <div class="glist-header" id="glist-header-${glist.id}">
          <a class="glist-dropdown-btn dropdown-toggle" href="#">
            <h3 class="list-name mb-1">${escapeHTML(glist.name)}</h3>
          </a>

          <span class="drag-icon" title="click to drag">
            <i class="fas fa-grip-horizontal"></i>
          </span>

          ${renderGlistDropdown(glist, state)}
        </div>
      </div>

      <div class="add-task-container mb-2">
        <form class="add-task-form font-small">
          <input class="add-task-input"
                 type="text"
                 placeholder="Add Task"
                 required>
          <button class="btn-check task-add" type="submit">
            <i class="fas fa-check"></i>
          </button>
        </form>
      </div>

      <div id="task-container-${glist.id}" class="task-container sortable-tasks">
        ${tasks.map(renderTask).join("")}
      </div>
    </div>
  `;
}

function renderGlistDropdown(glist, state) {
  const sortedLists = state.glists.allIds
    .map(id => state.glists.byId[id])
    .sort((a, b) => a.name.localeCompare(b.name));

  return `
    <div class="dropdown-menu">

      <button class="dropdown-item edit-glist-btn hidden" data-id="${glist.id}">
        <i class="far fa-edit"></i> Edit List Name
      </button>

      <button class="dropdown-item" data-id="${glist.id}">
        <i class="far fa-eye-slash"></i> Hide List
      </button>

      <button class="dropdown-item hidden" data-id="${glist.id}">
        <i class="far fa-copy"></i> Import Tasks From
      </button>

      <button class="dropdown-item text-danger" data-id="${glist.id}">
        <i class="fas fa-trash"></i> Delete List
      </button>

    </div>

    <div class="hidden import-list mb-1" id="import-list-${glist.id}">
      <div class="import-list-header pb-1 pt-1 pl-3">
        Import From
        <span class="pointer right">
          <i class="fas fa-times"></i>
        </span>
      </div>

      ${sortedLists.map(list => `
        <button class="dropdown-item pl-3">
          ${escapeHTML(list.name)}
        </button>
      `).join("")}
    </div>
  `;
}

function getTasksForGlist(state, glistId) {
  return state.tasks.allIds
    .map(id => state.tasks.byId[id])
    .filter(t => t.glist_id === glistId)
    .sort((a, b) => a.order - b.order);
}

/***** Task Functions *****/
function renderTask(task) {
  return `
    <form id="task_${task.id}" draggable="true">
      <input type="checkbox" ${task.completed ? "checked" : ""}>
      <label class="checkbox-label ${task.completed ? "is-completed" : ""}">
        ${escapeHTML(task.title)}
      </label>
    </form>
  `;
}

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

renderGlists(state);

// Add event listener for the "Create new list" button
const newListButton = document.getElementById("create-glist-btn");
if (newListButton) {
  newListButton.addEventListener("click", event => {
    event.preventDefault();
    const newListForm = document.getElementById("new-list-container");
    if (newListForm) {
      newListForm.classList.toggle("show");
    }
  });
}

// Handle submission of the create-glist-form
const createGlistForm = document.querySelector("#create-glist-form");
if (createGlistForm) {
  createGlistForm.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(createGlistForm);
    const newListName = formData.get("name").trim();

    if (newListName) {
      const newGlist = {
        id: `glist-${Date.now()}`,
        name: newListName,
        archived: false,
        order: state.glists.allIds.length,
      };

      state.glists.byId[newGlist.id] = newGlist;
      state.glists.allIds.push(newGlist.id);
      StateManager.save(state);
      renderGlists(state);

      // Reset the form and hide it
      createGlistForm.reset();
      newListContainer.classList.remove("show");
    }
  });
}

// Event listener for hiddenGlistsToggle
hiddenGlistsToggle.addEventListener('click', function () {
  hiddenGlistsDropdown.classList.toggle('show');
});

// Event delegation for dropdown buttons
if (listsContainer) {
  listsContainer.addEventListener("click", event => {
    const dropdownButton = event.target.closest(".glist-dropdown-btn");
    if (dropdownButton) {
      event.preventDefault();
      const dropdownMenu = dropdownButton.closest(".list-header").querySelector(".dropdown-menu");
      if (dropdownMenu) {
        closeAllDropdowns(dropdownMenu);
        dropdownMenu.classList.toggle("show");
      }
    }

    const deleteButton = event.target.closest(".dropdown-item.text-danger");
    if (deleteButton) {
      event.preventDefault();
      const glistId = deleteButton.dataset.id;
      const confirmation = confirm("Are you sure you want to delete this list?");

      if (confirmation) {
        // Delete the glist
        delete state.glists.byId[glistId];
        state.glists.allIds = state.glists.allIds.filter(id => id !== glistId);

        // Delete associated tasks
        const tasksToDelete = state.tasks.allIds.filter(taskId => state.tasks.byId[taskId].glist_id === glistId);
        tasksToDelete.forEach(taskId => {
          delete state.tasks.byId[taskId];
        });
        state.tasks.allIds = state.tasks.allIds.filter(taskId => !tasksToDelete.includes(taskId));

        // Save state and re-render
        StateManager.save(state);
        renderGlists(state);
      }
    }

    const hideButton = event.target.closest(".dropdown-item");
    if (hideButton && hideButton.textContent.includes("Hide List")) {
      event.preventDefault();
      const glistId = hideButton.dataset.id;
      archiveGlist(glistId);
    }
  });
}

function archiveGlist(glistId) {
  const glist = state.glists.byId[glistId];
  if (glist) {
    glist.archived = true;
    StateManager.save(state);
    renderGlists(state);
  } else {
    console.error(`Glist with ID ${glistId} not found.`);
  }
}

function unarchiveGlist(glistId) {
  const glist = state.glists.byId[glistId];
  if (glist) {
    glist.archived = false;
    StateManager.save(state);
    renderGlists(state);
  } else {
    console.error(`Glist with ID ${glistId} not found.`);
  }
}

function toggleTask(taskId) {
  const state = StateManager.load();
  const task = state.tasks.byId[taskId];

  if (task) {
    task.completed = !task.completed;
    StateManager.save(state);
    
    const taskElement = document.getElementById(`task_${taskId}`);
    const label = taskElement.querySelector('.checkbox-label');

    if (task.completed) {
      label.classList.add('is-completed');
    } else {
      label.classList.remove('is-completed');
    }
  }
}

function addTaskToGlist(glistId, taskTitle) {
  state = StateManager.load();

  if (!state.glists.byId[glistId]) {
    console.error(`Glist with ID ${glistId} not found.`);
    return;
  }

  const newTask = {
    id: `task-${Date.now()}`,
    title: taskTitle,
    completed: false,
    glist_id: glistId,
    order: state.tasks.allIds.length,
  };

  state.tasks.byId[newTask.id] = newTask;
  state.tasks.allIds.push(newTask.id);
  StateManager.save(state);
  state = StateManager.load();

  const taskContainer = document.getElementById(`task-container-${glistId}`);
  if (taskContainer) {
    taskContainer.insertAdjacentHTML("beforeend", renderTask(newTask));
  }
}

// Add event listener for all add-task-form submissions
document.addEventListener("submit", event => {
  const form = event.target.closest(".add-task-form");
  if (form) {
    event.preventDefault();

    const input = form.querySelector(".add-task-input");
    const glistContainer = form.closest(".list-container");

    if (input && glistContainer) {
      const glistId = glistContainer.id.replace("glist-container_", "");
      const taskTitle = input.value.trim();

      if (taskTitle) {
        addTaskToGlist(glistId, taskTitle);
        form.reset();
      }
    }
  }
});

// Add event listener for all task checkbox changes
document.addEventListener("change", event => {
  const checkbox = event.target.closest("input[type='checkbox']");
  if (checkbox) {
    const taskForm = checkbox.closest("form");
    if (taskForm) {
      const taskId = taskForm.id.replace("task_", "");
      toggleTask(taskId);
    }
  }
});

// Event listener for delete completed tasks button
deleteCompletedTasksBtn.addEventListener('click', function(event) {
  event.preventDefault();
  const confirmation = confirm("Are you sure you want to delete all completed tasks?");
  if (confirmation) {
    deleteCompletedTasks();
  }
});

function deleteCompletedTasks() {
  state = StateManager.load();
  const completedTaskIds = state.tasks.allIds.filter(id => state.tasks.byId[id].completed);

  completedTaskIds.forEach(id => {
    delete state.tasks.byId[id];
  });
  
  state.tasks.allIds = state.tasks.allIds.filter(id => !completedTaskIds.includes(id));
  StateManager.save(state);
  renderGlists(state);
}

function closeAllDropdowns(exceptDropdown = null) {
  const dropdowns = document.querySelectorAll('.dropdown-menu.show');
  dropdowns.forEach(dropdown => {
    if (dropdown !== exceptDropdown) {
      dropdown.classList.remove('show');
    }
  });
}

// Enable drag-and-drop functionality for glists
listsContainer.addEventListener("dragstart", event => {
  const glist = event.target.closest(".list-container");
  if (glist) {
    event.dataTransfer.setData("text/plain", glist.id);
    glist.classList.add("dragging");
  }
});

listsContainer.addEventListener("dragover", event => {
  event.preventDefault();
  const draggingGlist = document.querySelector(".dragging");
  const closestGlist = event.target.closest(".list-container");

  if (closestGlist && closestGlist !== draggingGlist) {
    const bounding = closestGlist.getBoundingClientRect();
    const offset = event.clientY - bounding.top;

    if (offset > bounding.height / 2) {
      closestGlist.after(draggingGlist);
    } else {
      closestGlist.before(draggingGlist);
    }
  }
});

listsContainer.addEventListener("dragend", () => {
  const draggingGlist = document.querySelector(".dragging");
  if (draggingGlist) {
    draggingGlist.classList.remove("dragging");
  }

  // Update the state with the new order
  const newOrder = Array.from(listsContainer.children).map((child, index) => {
    const glistId = child.id.replace("glist-container_", "");
    state.glists.byId[glistId].order = index;
    return glistId;
  });

  state.glists.allIds = newOrder;
  StateManager.save(state);
});

// Enable drag-and-drop functionality for tasks within each glist
listsContainer.addEventListener("dragstart", event => {
  const task = event.target.closest("form");
  if (task && task.parentElement.classList.contains("task-container")) {
    event.dataTransfer.setData("text/plain", task.id);
    task.classList.add("dragging");
  }
});

listsContainer.addEventListener("dragover", event => {
  const taskContainer = event.target.closest(".task-container");
  if (taskContainer) {
    event.preventDefault();
    const draggingTask = taskContainer.querySelector(".dragging");
    const closestTask = event.target.closest("form");

    // Prevent inserting the draggingTask before or after itself
    if (closestTask && closestTask !== draggingTask) {
      const bounding = closestTask.getBoundingClientRect();
      const offset = event.clientY - bounding.top;

      if (offset > bounding.height / 2 && closestTask.nextSibling !== draggingTask) {
        closestTask.after(draggingTask);
      } else if (offset <= bounding.height / 2 && closestTask.previousSibling !== draggingTask) {
        closestTask.before(draggingTask);
      }
    }
  }
});

listsContainer.addEventListener("dragend", event => {
  console.log("Drag end event triggered", state);

  const draggingTask = document.querySelector(".dragging");
  if (draggingTask) {
    draggingTask.classList.remove("dragging");
  }

  const taskContainer = event.target.closest(".task-container");
  if (taskContainer) {
    const newTaskOrder = Array.from(taskContainer.children).map((child, index) => {
      console.log("Processing child:", child.name, child.id);

      const taskId = child.id.replace("task_", "");
      if (state.tasks.byId[taskId]) {
        state.tasks.byId[taskId].order = index; // Update the order property
      }

      else {
        console.error(`Task with ID ${taskId} not found in state.`);
      }

      return taskId;
    });

    state.tasks.allIds = state.tasks.allIds.filter(id => !newTaskOrder.includes(id)).concat(newTaskOrder);
    StateManager.save(state);
  }
});