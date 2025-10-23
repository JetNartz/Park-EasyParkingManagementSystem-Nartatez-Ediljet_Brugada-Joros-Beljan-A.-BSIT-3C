let parkingData = {};
let currentSlot = null;
const columns = ['col1', 'col2', 'col3', 'col4'];
const totalSlotsCount = columns.length * 5;

// Load data from localStorage
function loadFromStorage() {
    const storedParkingData = localStorage.getItem('parkingData');
    const storedLogs = localStorage.getItem('parkingLogs');

    if (storedParkingData) {
        parkingData = JSON.parse(storedParkingData);
    }

    if (storedLogs) {
        const logTableBody = document.getElementById('logTable').querySelector('tbody');
        logTableBody.innerHTML = storedLogs; // Load the stored logs into the table

        // Optionally, you can also recreate the log entries in the parkingData if needed
        // This is useful if you want to keep track of the parking data as well
        const rows = logTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const slot = row.cells[0].textContent;
            const timeIn = row.cells[5].textContent !== '--' ? new Date(row.cells[5].textContent) : null;
            const timeOut = row.cells[6].textContent !== '--' ? new Date(row.cells[6].textContent) : null;
            parkingData[slot] = {
                validSticker: row.cells[1].textContent,
                carType: row.cells[2].textContent,
                vehicleName: row.cells[3].textContent,
                plateNumber: row.cells[4].textContent,
                timeIn: timeIn,
                timeOut: timeOut
            };
        });
    }
}


// Save current data to localStorage
function saveToStorage() {
    localStorage.setItem('parkingData', JSON.stringify(parkingData));
    const logHTML = document.getElementById('logTable').querySelector('tbody').innerHTML;
    localStorage.setItem('parkingLogs', logHTML);
}

// Initialize parking slots
function initializeParkingSlots() {
    loadFromStorage();

    columns.forEach((colId, colIndex) => {
        const column = document.getElementById(colId);
        if (!column) return;

        for (let i = 1; i <= 5; i++) {
            const slotId = `${String.fromCharCode(65 + colIndex)}${i}`;
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.id = slotId;
            slot.onclick = () => openModal(slotId);

            if (parkingData[slotId]) {
                slot.classList.add('occupied');
            }

            column.appendChild(slot);
        }
    });

    updateStats();
}

// Open modal
function openModal(slotId) {
    currentSlot = slotId;
    const modal = document.getElementById('parkingModal');
    const selectedSlotSpan = document.getElementById('selectedSlot');
    const submitBtn = document.getElementById('submitBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const timeOutGroup = document.getElementById('timeOutGroup');
    const form = document.getElementById('parkingForm');

    selectedSlotSpan.textContent = slotId;
    form.reset();

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('timeIn').value = now.toISOString().slice(0, 16);

    if (parkingData[slotId]) {
        const data = parkingData[slotId];
        document.getElementById('validSticker').value = data.validSticker;
        document.getElementById('carType').value = data.carType;
        document.getElementById('vehicleName').value = data.vehicleName;
        document.getElementById('plateNumber').value = data.plateNumber;
        document.getElementById('timeIn').value = data.timeIn;

        document.querySelectorAll('#parkingForm input, #parkingForm select').forEach(el => el.disabled = true);

        submitBtn.style.display = 'none';
        checkoutBtn.style.display = 'block';
        timeOutGroup.style.display = 'block';
        document.getElementById('timeOut').value = now.toISOString().slice(0, 16);
    } else {
        document.querySelectorAll('#parkingForm input, #parkingForm select').forEach(el => el.disabled = false);
        submitBtn.style.display = 'block';
        checkoutBtn.style.display = 'none';
        timeOutGroup.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('parkingModal').style.display = 'none';
    currentSlot = null;
}

// Handle parking check-in
document.getElementById('parkingForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const validSticker = document.getElementById('validSticker').value;
    const carType = document.getElementById('carType').value;
    const vehicleName = document.getElementById('vehicleName').value;
    const plateNumber = document.getElementById('plateNumber').value;
    const timeIn = document.getElementById('timeIn').value;

    if (!validSticker || !carType || !vehicleName || !plateNumber || !timeIn) {
        alert('Please fill in all required fields.');
        return;
    }

    parkingData[currentSlot] = {
        validSticker, carType, vehicleName, plateNumber, timeIn, timeOut: null
    };

    const slotElement = document.getElementById(currentSlot);
    slotElement.classList.add('occupied');

    addLogEntry(currentSlot, validSticker, carType, vehicleName, plateNumber, timeIn, null, "Occupied");
    updateStats();
    saveToStorage();
    closeModal();
});

// Checkout
function checkoutVehicle() {
    const timeOut = new Date();
    const timeIn = new Date(document.getElementById('timeIn').value);
    const hoursParked = Math.ceil((timeOut - timeIn) / (1000 * 60 * 60));

    const validSticker = document.getElementById('validSticker').value;
    const vehicleType = document.getElementById('carType').value;
    const vehicleName = document.getElementById('vehicleName').value;
    const plateNumber = document.getElementById('plateNumber').value;
    const parkingFee = calculateParkingFee(vehicleType, validSticker, hoursParked);

    const slotElement = document.getElementById(currentSlot);
    slotElement.classList.remove('occupied');

    updateLogTable(currentSlot, timeOut.toISOString(), parkingFee);
    delete parkingData[currentSlot];
    updateStats();
    saveToStorage();
    closeModal();

    // Show the summary modal
    showSummaryModal({
        slot: currentSlot,
        vehicleType,
        vehicleName,
        plateNumber,
        timeIn: formatDateTime(timeIn),
        timeOut: formatDateTime(timeOut),
        hours: hoursParked,
        fee: parkingFee
    });
}

// ✅ Added these functions
function showSummaryModal(data) {
    document.getElementById('summarySlot').textContent = data.slot;
    document.getElementById('summaryVehicleType').textContent = data.vehicleType;
    document.getElementById('summaryVehicleName').textContent = data.vehicleName;
    document.getElementById('summaryPlate').textContent = data.plateNumber;
    document.getElementById('summaryTimeIn').textContent = data.timeIn;
    document.getElementById('summaryTimeOut').textContent = data.timeOut;
    document.getElementById('summaryHours').textContent = data.hours + " hr(s)";
    document.getElementById('summaryFee').textContent = "₱" + data.fee.toFixed(2);

    document.getElementById('checkoutSummaryModal').style.display = 'flex';
}

function closeSummaryModal() {
    document.getElementById('checkoutSummaryModal').style.display = 'none';
}

function updateStats() {
    const occupiedCount = Object.keys(parkingData).length;
    const availableCount = totalSlotsCount - occupiedCount;

    document.getElementById('occupiedSlots').textContent = occupiedCount;
    document.getElementById('availableSlots').textContent = availableCount;
}

function formatDateTime(date) {
    const options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    };
    return new Date(date).toLocaleString('en-US', options);
}

function addLogEntry(slot, sticker, vehicleType, vehicleName, plateNumber, timeIn, timeOut, status) {
    const logTable = document.getElementById('logTable').querySelector('tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${slot}</td>
        <td>${sticker}</td>
        <td>${vehicleType}</td>
        <td>${vehicleName}</td>
        <td>${plateNumber}</td>
        <td>${timeIn ? formatDateTime(timeIn) : '--'}</td>
        <td>${timeOut ? formatDateTime(timeOut) : '--'}</td>
        <td>${status}</td>
    `;
    logTable.appendChild(row);
    saveToStorage();
}

function updateLogTable(slot, timeOut, parkingFee) {
    const rows = document.querySelectorAll('#logTable tbody tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === slot) {
            row.cells[6].textContent = formatDateTime(timeOut);
            row.cells[7].textContent = `Checked Out (₱${parkingFee})`;
        }
    });
    saveToStorage();
}

function calculateParkingFee(vehicleType, validSticker, hoursParked) {
    let baseRate = 0, succeedingRate = 0;
    if (vehicleType === 'Light Vehicle') {
        baseRate = validSticker === 'With Valid Sticker' ? 50 : 70;
        succeedingRate = validSticker === 'With Valid Sticker' ? 20 : 30;
    } else if (vehicleType === 'Motorcycle') {
        baseRate = validSticker === 'With Valid Sticker' ? 30 : 50;
        succeedingRate = validSticker === 'With Valid Sticker' ? 10 : 20;
    }
    return hoursParked <= 10 ? baseRate : baseRate + (hoursParked - 10) * succeedingRate;
}

// Menu logic
const burgerMenu = document.getElementById('burgerMenu');
const dropdownMenu = document.getElementById('dropdownMenu');
const homeOption = document.getElementById('homeOption');
const logOption = document.getElementById('logOption');
const logoutOption = document.getElementById('logoutOption');
const mainContainer = document.querySelector('.container');
const logContainer = document.getElementById('parkingLogContainer');

burgerMenu.addEventListener('click', () => {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
});

homeOption.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
    mainContainer.style.display = 'block';
    logContainer.style.display = 'none';
});

logOption.addEventListener('click', async () => {
    dropdownMenu.style.display = 'none';
    mainContainer.style.display = 'none';
    logContainer.style.display = 'block';
    await loadLogsFromDatabase();
});


logoutOption.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
    mainContainer.style.display = 'none';
    logContainer.style.display = 'none';
    alert('You have been logged out.');
});

// Search
document.getElementById('searchInput').addEventListener('input', function (e) {
    const searchValue = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#logTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    });
});

// Synchronize logs between staff and admin
function syncLogs() {
    const storedLogs = localStorage.getItem("parkingLogs");
    if (storedLogs) {
        const adminLogTable = document.querySelector("#Admin-logTable tbody");
        const staffLogTable = document.querySelector("#logTable tbody");

        if (adminLogTable) {
            adminLogTable.innerHTML = storedLogs;
        }
        if (staffLogTable) {
            staffLogTable.innerHTML = storedLogs;
        }
    }
}

// Listen for localStorage updates
window.addEventListener("storage", (event) => {
    if (event.key === "parkingLogs") {
        syncLogs();
    }
});

// Call syncLogs periodically to ensure consistency
setInterval(syncLogs, 5000);

// Initialize
document.addEventListener('DOMContentLoaded', initializeParkingSlots);
async function loadLogsFromDatabase() {
  try {
    const res = await fetch("http://localhost:3000/api/logs");
    const logs = await res.json();
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = "";

    logs.forEach(log => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${log.slot_id}</td>
        <td>${log.valid_sticker}</td>
        <td>${log.vehicle_type}</td>
        <td>${log.vehicle_name}</td>
        <td>${log.plate_number}</td>
        <td>${log.time_in || "--"}</td>
        <td>${log.time_out || "--"}</td>
        <td>${log.status}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load logs:", error);
  }
}
