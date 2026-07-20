# TaskMaster API Documentation

This document outlines the REST API endpoints exposed by the Java `TaskServer`. The server runs locally on `http://localhost:8080` and returns all data in JSON format.

## Base URL
`http://localhost:8080/api`

---

## Endpoints

### 1. Get All Tasks
Retrieves a list of all tasks currently in the database.

*   **URL:** `/tasks`
*   **Method:** `GET`
*   **Success Response:**
    *   **Code:** `200 OK`
    *   **Content:**
    ```json
    [
      {
        "id": 1,
        "title": "Set up Database",
        "description": "Write SQL scripts",
        "status": "TO_DO",
        "dueDate": "2026-07-25"
      },
      {
        "id": 2,
        "title": "Build UI",
        "description": "Write HTML/CSS",
        "status": "IN_PROGRESS",
        "dueDate": "2026-07-22"
      }
    ]
    ```

### 2. Add a New Task (To Be Implemented)
Creates a new task in the database.

*   **URL:** `/tasks`
*   **Method:** `POST`
*   **Data Params (JSON):**
    ```json
    {
      "title": "New Task Name",
      "description": "Task details here",
      "dueDate": "YYYY-MM-DD"
    }
    ```
*   **Success Response:**
    *   **Code:** `201 Created`

### 3. Update Task Status (To Be Implemented)
Updates the status of a task when moved on the Kanban board.

*   **URL:** `/tasks/{id}`
*   **Method:** `PUT`
*   **Data Params (JSON):**
    ```json
    {
      "status": "COMPLETED"
    }
    ```
*   **Success Response:**
    *   **Code:** `200 OK`

---

## CORS Configuration
The server is configured to allow Cross-Origin Resource Sharing (CORS) with the header `Access-Control-Allow-Origin: *`. This allows the local `index.html` file to make fetch requests without being blocked by the browser.