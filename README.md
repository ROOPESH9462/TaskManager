# TaskMaster - Workflow Organizer

TaskMaster is a lightweight, full-stack Single Page Application (SPA) designed to help users organize their workflows using a Kanban-style board. 

This project was built from scratch without the use of heavy frameworks to demonstrate a deep understanding of core web and backend technologies.

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML5, CSS3 (Flexbox & Grid, dark-glassmorphism theme), and JavaScript (ES6+ Fetch API, HTML5 Drag & Drop, Optimistic UI Updates, XSS Sanitization)
- **Backend:** Core Java 17+ (built-in `com.sun.net.httpserver.HttpServer` running on port 8080)
- **Database:** MySQL (connected via raw JDBC using `java.sql` and the DAO pattern with `PreparedStatement`)
- **JSON Utility:** Dedicated, custom-written `JsonUtils.java` for zero-dependency JSON serialization and parsing
- **External Libraries:** MySQL Connector/J `.jar` driver (only external dependency)

---

## 📂 Project Structure
```text
TaskMaster/
├── database/             # SQL Schema scripts (schema.sql)
├── frontend/             # Single Page Application (HTML/CSS/JS)
├── lib/                  # External Libraries (MySQL JDBC Driver placeholder & instruction)
├── src/                  # Core Java Backend source files
│   └── com/
│       └── taskmaster/
│           ├── DatabaseConfig.java   # JDBC database connection loading
│           ├── Task.java             # Task Model Class (POJO)
│           ├── JsonUtils.java        # Custom JSON serializer & parser
│           ├── TaskDAO.java          # JDBC database access logic
│           └── TaskServer.java       # HTTP Server and endpoints
└── README.md             # Project documentation and guide
```

---

## 🚀 Step-by-Step Instructions

### 1. Database Setup
1. Ensure you have **MySQL Server** installed and running on your system.
2. Log into your MySQL console or graphical client (e.g. WorkBench, DBeaver) and run the SQL script located in `database/schema.sql`:
   ```sql
   SOURCE database/schema.sql;
   ```
   This creates the database `taskmaster_db` and initializes the `tasks` table with 3 rows of mock data.

### 2. Add MySQL JDBC Driver
1. Download the platform-independent version of the **MySQL Connector/J** driver from the [Official MySQL Download Page](https://dev.mysql.com/downloads/connector/j/).
2. Extract the archive and copy the `.jar` file (e.g., `mysql-connector-j-9.x.x.jar`).
3. Paste the file directly into the `lib/` directory of this project.

### 3. Environment Variables & Server Configuration
The Java backend retrieves database connection details from environment variables with safe defaults. If your local database uses standard configuration (`localhost:3306`, username `root`, password `root`), no action is required. Otherwise, set the following environment variables:

- **Windows Powershell:**
  ```powershell
  $env:DB_URL="jdbc:mysql://localhost:3306/taskmaster_db"
  $env:DB_USER="your_mysql_username"
  $env:DB_PASS="your_mysql_password"
  ```
- **Linux / macOS:**
  ```bash
  export DB_URL="jdbc:mysql://localhost:3306/taskmaster_db"
  export DB_USER="your_mysql_username"
  export DB_PASS="your_mysql_password"
  ```

### 4. Compilation
To compile the Java source files into class files inside a `bin/` directory, execute the following command from the project root:

- **Windows Powershell:**
  ```powershell
  javac -d bin -cp "lib/*" src/com/taskmaster/*.java
  ```
- **Linux / macOS:**
  ```bash
  javac -d bin -cp "lib/*" src/com/taskmaster/*.java
  ```

### 5. Execution
Run the compiled server with the classpath set to the `bin/` directory and the `lib/` directory:

- **Windows Powershell:**
  ```powershell
  java -cp "bin;lib/*" com.taskmaster.TaskServer
  ```
- **Linux / macOS:**
  ```bash
  java -cp "bin:lib/*" com.taskmaster.TaskServer
  ```

You should see:
```text
TaskMaster Server is running on port 8080
```

### 6. Accessing the Frontend UI
1. Navigate to the `frontend/` folder.
2. Open `index.html` in any web browser.
3. The board will fetch existing tasks from the backend and display them. You can now drag tasks between columns or create new tasks using the **Add Task** button!