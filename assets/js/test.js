const state = {
  meta: {
    version: 1,
    lastUpdated: 1700000000000
  },

  glists: {
    byId: {
      "g1": {
        id: "g1",
        name: "Work",
        description: "Work-related tasks",
        archived: false,
        order: 1
      },
      "g2": {
        id: "g2",
        name: "Home",
        description: "",
        archived: false,
        order: 2
      }
    },
    allIds: ["g1", "g2"]
  },

  tasks: {
    byId: {
      "t1": {
        id: "t1",
        glist_id: "g1",
        title: "Fix login bug",
        description: "",
        completed: false,
        order: 1
      },
      "t2": {
        id: "t2",
        glist_id: "g1",
        title: "Email client",
        description: "",
        completed: true,
        order: 2
      }
    },
    allIds: ["t1", "t2"]
  }
}

localStorage.setItem("glistApp", JSON.stringify(state));
