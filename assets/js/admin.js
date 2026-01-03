const STORAGE_KEY = "glistApp";
const exportButton = document.getElementById('exportButton');
const importButton = document.getElementById('importButton');
const clearButton = document.getElementById('clearButton');
const form = document.getElementById('importForm');

let state = loadState();

function loadState() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {
        meta: { version: 1, lastUpdated: Date.now() },
        glists: { byId: {}, allIds: [] },
        tasks: { byId: {}, allIds: [] }
    };
}

// Function to export data as JSON and copy to clipboard
function exportDataToClipboard(data) {
    try {
        // Convert the data to a JSON string
        const jsonData = JSON.stringify(data, null, 2);

        // Copy the JSON string to the clipboard
        navigator.clipboard.writeText(jsonData).then(() => {
            alert('Data has been copied to the clipboard!');
        }).catch(err => {
            console.error('Failed to copy data to clipboard:', err);
            alert('Failed to copy data to clipboard.');
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data.');
    }
}


// Add an event listener to a button for exporting data
exportButton.addEventListener('click', () => {
    state= loadState();
    exportDataToClipboard(state);
});

// Add an event listener to a button for updating localStorage
importButton.addEventListener('click', () => {
    if (!form) {
        alert('Import form not found');
        return;
    }

    form.classList.toggle('hidden');
});

// Add an event listener to a button for clearing localStorage
clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        alert('Your data has been cleared successfully!');
    }
});

form.addEventListener('submit', function (e) {
    e.preventDefault();
    const dataEl = document.getElementById('importJson');
    if (!dataEl) {
        alert('Textarea not found in form');
        return;
    }

    const data = dataEl.value;

    if (!isValidJSON(data)) {
        alert('Your data is invalid. Check your entry and try again.');
        return;
    }

    const parsedData = JSON.parse(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
    state = loadState();
    alert('LocalStorage has been updated successfully!');
});

function isValidJSON(text) {
    text = text.trim();

    if (typeof text !== "string" || text === "") {
        return false; // Basic input check
    }

    if (!text.startsWith("{")) {
        return false; // Must start with an opening brace
    }

    if (!text.includes('meta')) {
        return false; // Must contain 'meta' key
    }

        try {
            JSON.parse(text);
            return true;
        } catch (e) {
            // An error occurred, so the JSON is malformed
            console.error("Invalid JSON detected:", e.message);
            return false;
        }
}