/**
 * Initializes Tablesort with persistence using the table's ID.
 * @param {string} tableId - The HTML ID of the table to sort.
 */
function enablePersistentSort(tableId) {
    const table = document.getElementById(tableId);

    // Exit if table doesn't exist on this page
    if (!table) return;

    // Initialize Tablesort lib
    new Tablesort(table);

    // Create unique keys for this specific table ID
    const keyCol = 'sort_col_' + tableId;
    const keyDir = 'sort_dir_' + tableId;

    // --- Restore Sort State ---
    const savedCol = localStorage.getItem(keyCol);
    const savedDir = localStorage.getItem(keyDir);

    if (savedCol !== null) {
        const ths = table.querySelectorAll('thead th');
        const thToClick = ths[savedCol];

        if (thToClick) {
            // Simulate click to sort
            thToClick.click();

            // If saved direction was descending but click resulted in ascending, click again
            if (savedDir === 'descending' && thToClick.getAttribute('aria-sort') === 'ascending') {
                thToClick.click();
            }
        }
    }

    // --- Save Sort State on Click ---
    table.querySelector('thead').addEventListener('click', function () {
        // Small delay to let Tablesort update the DOM
        setTimeout(function () {
            const ths = table.querySelectorAll('thead th');
            for (let i = 0; i < ths.length; i++) {
                if (ths[i].getAttribute('aria-sort')) {
                    // Save index and direction with unique key
                    localStorage.setItem(keyCol, i);
                    localStorage.setItem(keyDir, ths[i].getAttribute('aria-sort'));
                    break;
                }
            }
        }, 50);
    });
}