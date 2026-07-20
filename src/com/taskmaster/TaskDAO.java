package com.taskmaster;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class TaskDAO {
    private static boolean useMockFallback = false;
    private static final List<Task> mockTasks = new ArrayList<>();
    private static int nextId = 4;

    static {
        mockTasks.add(new Task(1, "Set up Project Structure", "Initialize the Java project structure and setup directories.", "COMPLETED", "2026-07-15"));
        mockTasks.add(new Task(2, "Create Database Schema", "Define taskmaster_db and tasks table structure.", "IN_PROGRESS", "2026-07-22"));
        mockTasks.add(new Task(3, "Implement JDBC Connection", "Write Java code to connect to the MySQL database.", "TO_DO", "2026-07-25"));
    }

    public List<Task> getAllTasks() throws SQLException {
        if (useMockFallback) {
            return new ArrayList<>(mockTasks);
        }
        
        List<Task> tasks = new ArrayList<>();
        String sql = "SELECT id, title, description, status, due_date FROM tasks";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                Task task = new Task();
                task.setId(rs.getInt("id"));
                task.setTitle(rs.getString("title"));
                task.setDescription(rs.getString("description"));
                task.setStatus(rs.getString("status"));
                
                java.sql.Date dueDate = rs.getDate("due_date");
                if (dueDate != null) {
                    task.setDueDate(dueDate.toString());
                } else {
                    task.setDueDate(null);
                }
                
                tasks.add(task);
            }
            return tasks;
        } catch (SQLException e) {
            System.err.println("[DATABASE WARNING] Could not connect to MySQL database: " + e.getMessage());
            System.err.println("[FALLBACK] Switching to In-Memory Mock Mode. Changes will be saved in-memory for this session.");
            useMockFallback = true;
            return new ArrayList<>(mockTasks);
        }
    }

    public void addTask(Task task) throws SQLException {
        if (useMockFallback) {
            task.setId(nextId++);
            if (task.getStatus() == null) {
                task.setStatus("TO_DO");
            }
            mockTasks.add(task);
            return;
        }

        String sql = "INSERT INTO tasks (title, description, status, due_date) VALUES (?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            ps.setString(1, task.getTitle());
            ps.setString(2, task.getDescription());
            ps.setString(3, task.getStatus() != null ? task.getStatus() : "TO_DO");
            
            if (task.getDueDate() != null && !task.getDueDate().trim().isEmpty()) {
                ps.setDate(4, java.sql.Date.valueOf(task.getDueDate().trim()));
            } else {
                ps.setNull(4, java.sql.Types.DATE);
            }
            
            ps.executeUpdate();
            
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    task.setId(rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            System.err.println("[DATABASE ERROR] Failed to insert task into MySQL: " + e.getMessage());
            System.err.println("[FALLBACK] Inserting task into in-memory database.");
            useMockFallback = true;
            task.setId(nextId++);
            if (task.getStatus() == null) {
                task.setStatus("TO_DO");
            }
            mockTasks.add(task);
        }
    }

    public void updateTaskStatus(int id, String status) throws SQLException {
        if (useMockFallback) {
            for (Task t : mockTasks) {
                if (t.getId() != null && t.getId() == id) {
                    t.setStatus(status);
                    break;
                }
            }
            return;
        }

        String sql = "UPDATE tasks SET status = ? WHERE id = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setString(1, status);
            ps.setInt(2, id);
            
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DATABASE ERROR] Failed to update status in MySQL: " + e.getMessage());
            System.err.println("[FALLBACK] Updating status in in-memory database.");
            useMockFallback = true;
            for (Task t : mockTasks) {
                if (t.getId() != null && t.getId() == id) {
                    t.setStatus(status);
                    break;
                }
            }
        }
    }

    public void deleteTask(int id) throws SQLException {
        if (useMockFallback) {
            mockTasks.removeIf(t -> t.getId() != null && t.getId() == id);
            return;
        }

        String sql = "DELETE FROM tasks WHERE id = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            System.err.println("[DATABASE ERROR] Failed to delete task in MySQL: " + e.getMessage());
            System.err.println("[FALLBACK] Deleting task from in-memory database.");
            useMockFallback = true;
            mockTasks.removeIf(t -> t.getId() != null && t.getId() == id);
        }
    }
}
