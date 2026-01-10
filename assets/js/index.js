import StateManager from './state.js';
import DragDropManager from './dragdrop.js';

// const STORAGE_KEY = "glistApp";
const createGlistForm = document.querySelector("#create-glist-form");
const deleteCompletedTasksBtn = document.getElementById('delete-completed-tasks-btn');
const hiddenGlistsDropdown = document.getElementById('archived-lists');
const hiddenGlistsToggle = document.getElementById('archived-lists-toggle');
const listsContainer = document.getElementById('lists-container');
const mobileMenu = document.getElementById('navbarSupportedContent');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const newListButton = document.getElementById("create-glist-btn");
const newListContainer = document.getElementById('new-list-container');

// Load initial state
let state = StateManager.load();

// Initial render
renderGlists(state);

// Mobile menu toggle
setUpToggle(mobileMenuToggle, mobileMenu);

// Archived lists toggle
setUpToggle(hiddenGlistsToggle, hiddenGlistsDropdown);

// New list form toggle
setUpToggle(newListButton, newListContainer);

// Handle submission of the create-glist-form
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
deleteCompletedTasksBtn.addEventListener('click', function (event) {
  event.preventDefault();
  const confirmation = confirm("Are you sure you want to delete all completed tasks?");
  if (confirmation) {
    deleteCompletedTasks();
  }
});


/***** Functions *********************************/

function setUpToggle(toggler, toggled) {
  toggler.addEventListener('click', function (e) {
    e.preventDefault();
    toggled.classList.toggle('show');
  });
}// setUpToggle

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
      hiddenGlistsToggle.classList.add('show');

      archivedGlists.forEach(glist => {
        let archivedItem = document.createElement('button');
        archivedItem.classList.add('dropdown-item');
        archivedItem.setAttribute('data-list', glist.id);
        archivedItem.innerText = escapeHTML(glist.name);
        archivedItem.addEventListener('click', function () {
          unarchiveGlist(glist.id);
        });

        hiddenGlistsDropdown.appendChild(archivedItem);
      });
    }

    else {
      hiddenGlistsDropdown.classList.remove('show');
      hiddenGlistsDropdown.innerHTML = '';
      hiddenGlistsToggle.classList.remove('show');
    }
  }
}// renderGlists

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
}// renderGlist

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
}// renderGlistDropdown

function getTasksForGlist(state, glistId) {
  return state.tasks.allIds
    .map(id => state.tasks.byId[id])
    .filter(t => t.glist_id === glistId)
    .sort((a, b) => a.order - b.order);
}// getTasksForGlist

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
}// renderTask

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}// escapeHTML

function archiveGlist(glistId) {
  const glist = state.glists.byId[glistId];
  if (glist) {
    glist.archived = true;
    StateManager.save(state);
    renderGlists(state);
  } else {
    alert(`Glist with ID ${glistId} not found.`);
  }
}// archiveGlist

function unarchiveGlist(glistId) {
  const glist = state.glists.byId[glistId];
  if (glist) {
    glist.archived = false;
    StateManager.save(state);
    renderGlists(state);
  } else {
    alert(`Glist with ID ${glistId} not found.`);
  }
}// unarchiveGlist

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
}// toggleTask

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
}// addTaskToGlist

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

// Initialize drag-and-drop functionality
DragDropManager.enableGlistDragAndDrop(listsContainer, state, StateManager.save);
DragDropManager.enableTaskDragAndDrop(listsContainer, state, StateManager.save);