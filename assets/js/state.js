// StateManager encapsulates state management logic
const STORAGE_KEY = "glistApp";

const StateManager = {
  load: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {
      meta: { version: 1, lastUpdated: Date.now() },
      glists: { byId: {}, allIds: [] },
      tasks: { byId: {}, allIds: [] },
    };
  },

  save: (state) => {
    state.meta.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  updateOrder: (items, orderKey) => {
    items.forEach((item, index) => {
      item[orderKey] = index;
    });
  },
};

export default StateManager;