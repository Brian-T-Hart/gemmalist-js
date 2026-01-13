const DragDropManager = {
  enableDragAndDrop: (StateManager) => {
    const listsContainer = document.getElementById("lists-container");
    // Unified dragstart event handler
    listsContainer.addEventListener("dragstart", event => {
      const glist = event.target.closest(".list-container");
      const task = event.target.closest("form");

      if (task && task.parentElement.classList.contains("task-container")) {
        event.dataTransfer.setData("text/plain", task.id);
        task.classList.add("dragging");
      } else if (glist) {
        event.dataTransfer.setData("text/plain", glist.id);
        glist.classList.add("dragging");
      } else {
        alert("Drag start event triggered on an invalid element:", event.target);
      }
    });

    // Unified dragover event handler
    listsContainer.addEventListener("dragover", event => {
      event.preventDefault();
      const draggingElement = document.querySelector(".dragging");
      const closestElement = event.target.closest(".task-container form, .list-container");

      if (closestElement && closestElement !== draggingElement) {
        const bounding = closestElement.getBoundingClientRect();
        const offset = event.clientY - bounding.top;

        if (offset > bounding.height / 2 && closestElement.nextSibling !== draggingElement) {
          closestElement.after(draggingElement);
        } else if (offset <= bounding.height / 2 && closestElement.previousSibling !== draggingElement) {
          closestElement.before(draggingElement);
        }
      }
    });

    // Unified dragend event handler
    listsContainer.addEventListener("dragend", event => {
      const draggingElement = document.querySelector(".dragging");
      if (draggingElement) {
        draggingElement.classList.remove("dragging");
      }

      const state = StateManager.load();
      const container = event.target.closest(".task-container, .list-container");

      if (container) {
        const isGlist = container.classList.contains("list-container");

        const newOrder = Array.from(container.children).map((child, index) => {
          if (!child.id) {
            alert("Element is missing an ID:", child);
            return null;
          }
          const id = isGlist
            ? child.id.replace("glist-container_", "")
            : child.id.replace("task_", "");

          const stateSection = isGlist ? state.glists : state.tasks;
          if (!stateSection.byId[id]) {
            alert(`State is missing ${isGlist ? "glist" : "task"} ID:`, id);
            return null;
          }
          stateSection.byId[id].order = index;
          return id;
        }).filter(Boolean);

        if (isGlist) {
          state.glists.allIds = newOrder;
        } else {
          state.tasks.allIds = state.tasks.allIds.filter(id => !newOrder.includes(id)).concat(newOrder);
        }

        StateManager.save(state);
      } else {
        alert("Drag end event triggered outside of a valid container:", event.target);
        location.reload();
      }
    });
  }
};

export default DragDropManager;
