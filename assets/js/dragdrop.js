const DragDropManager = {
  enableGlistDragAndDrop: (listsContainer, state, saveState) => {
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
      saveState(state);
    });
  },

  enableTaskDragAndDrop: (listsContainer, state, saveState) => {
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
      const draggingTask = document.querySelector(".dragging");
      if (draggingTask) {
        draggingTask.classList.remove("dragging");
      }

      const taskContainer = event.target.closest(".task-container");
      if (taskContainer) {
        const newTaskOrder = Array.from(taskContainer.children).map((child, index) => {
          const taskId = child.id.replace("task_", "");
          if (state.tasks.byId[taskId]) {
            state.tasks.byId[taskId].order = index; // Update the order property
          }
          return taskId;
        });

        state.tasks.allIds = state.tasks.allIds.filter(id => !newTaskOrder.includes(id)).concat(newTaskOrder);
        saveState(state);
      }
    });
  }
};

export default DragDropManager;
