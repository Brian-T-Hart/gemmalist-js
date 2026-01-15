const DragDropManager = {
  enableDragAndDrop: (StateManager) => {
    const listsContainer = document.getElementById("lists-container");

    // Unified dragstart event handler
    listsContainer.addEventListener("dragstart", event => {
      console.log("Drag started on element:", event.target);

      if (event.target.classList.contains("task")) {
        event.dataTransfer.setData("text/plain", event.target.id);
        event.target.classList.add("dragging");
      } else if (event.target.classList.contains("list-container")) {
        event.dataTransfer.setData("text/plain", event.target.id);
        event.target.classList.add("dragging");
      } else {
        console.error("Drag start event triggered on an invalid element:", event.target);
      }
    });

    // Unified dragover event handler
    listsContainer.addEventListener("dragover", event => {
      event.preventDefault();
      const draggingElement = document.querySelector(".dragging");
      const closestElement = event.target.closest(".task, .list-container");

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
      const isGlist = draggingElement?.classList.contains("list-container");
      const isTask = draggingElement?.classList.contains("task");

      if (isGlist || isTask) {
        const container = isGlist
          ? document.querySelector("#lists-container")
          : draggingElement.parentElement;

        if (!container) {
          console.error("Drag end event triggered outside of a valid container:", event.target);
          location.reload();
          return;
        }

        const newOrder = Array.from(container.children).map((child, index) => {
          if (!child.id) {
            console.error("Element is missing an ID:", child);
            return null;
          }
          const id = isGlist
            ? child.id.replace("glist-container_", "")
            : child.id.replace("task_", "");

          const stateSection = isGlist ? state.glists : state.tasks;
          if (!stateSection.byId[id]) {
            console.error(`State is missing ${isGlist ? "glist" : "task"} ID:`, id, stateSection);
            return null;
          }
          stateSection.byId[id].order = index;
          return id;
        }).filter(Boolean);

        if (newOrder.length !== container.children.length) {
          console.error("Some elements were not processed correctly. Check the IDs and state.", {
            containerChildren: container.children,
            newOrder,
            state
          });
          console.error("Error: Some elements could not be reordered. Check the console for details.");
          return;
        }

        if (isGlist) {
          state.glists.allIds = newOrder;
        } else {
          state.tasks.allIds = state.tasks.allIds.filter(id => !newOrder.includes(id)).concat(newOrder);
        }

        StateManager.save(state);
      } else {
        console.error("Drag end event triggered on an invalid element:", event.target);
        console.error("Error: Drag end event triggered on an invalid element.");
      }
    });
  }
};

export default DragDropManager;
