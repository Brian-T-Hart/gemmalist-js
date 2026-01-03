const STORAGE_KEY = "glistApp";

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

const state = loadState();

// Add an event listener to a button for exporting data
document.getElementById('exportButton').addEventListener('click', () => {
    exportDataToClipboard(state);
});