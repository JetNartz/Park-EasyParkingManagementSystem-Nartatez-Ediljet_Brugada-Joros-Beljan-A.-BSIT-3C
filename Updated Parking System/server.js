const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // for serving your HTML/CSS/JS

// Serve static files from the 'Updated Parking System' folder
app.use(express.static(path.join(__dirname, "Updated Parking System")));

// Connect to SQLite database
const db = new sqlite3.Database("./DatabaseParkingSystem.db", (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// Create parking_logs table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS parking_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id TEXT,
    valid_sticker TEXT,
    vehicle_type TEXT,
    vehicle_name TEXT,
    plate_number TEXT,
    time_in TEXT,
    time_out TEXT,
    status TEXT
  )
`);

// 📦 GET all parking logs
app.get("/api/logs", (req, res) => {
  db.all("SELECT * FROM parking_logs ORDER BY log_id DESC", [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching logs:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 📝 POST new log
app.post("/api/logs", (req, res) => {
  const { slot_id, valid_sticker, vehicle_type, vehicle_name, plate_number, time_in, time_out, status } = req.body;
  db.run(
    `INSERT INTO parking_logs (slot_id, valid_sticker, vehicle_type, vehicle_name, plate_number, time_in, time_out, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [slot_id, valid_sticker, vehicle_type, vehicle_name, plate_number, time_in, time_out, status],
    function (err) {
      if (err) {
        console.error("❌ Error inserting log:", err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "✅ Log added successfully", log_id: this.lastID });
    }
  );
});

// Serve login page as the default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "ParkingSystemLogIn.html"));
});

// Serve staff page
app.get("/ParkingStaffSystem.html", (req, res) => {
  res.sendFile(path.join(__dirname, "ParkingStaffSystem.html"));
});

// Serve admin page
app.get("/ParkingAdminSystem.html", (req, res) => {
  res.sendFile(path.join(__dirname, "ParkingAdminSystem.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
