package com.taskmaster;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class TaskServer {
    private static final int PORT = 8080;
    private static final TaskDAO taskDAO = new TaskDAO();

    public static void main(String[] args) {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
            server.createContext("/api/tasks", new TasksHandler());
            server.setExecutor(null); // default executor
            System.out.println("TaskMaster Server is running on port " + PORT);
            server.start();
        } catch (IOException e) {
            System.err.println("Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    static class TasksHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                handleRequest(exchange);
            } catch (Exception e) {
                e.printStackTrace();
                sendErrorResponse(exchange, 500, e.getMessage());
            }
        }
    }

    private static void handleRequest(HttpExchange exchange) throws Exception {
        setCorsHeaders(exchange);
        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath();

        if ("OPTIONS".equals(method)) {
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
            return;
        }

        if (path.equals("/api/tasks") || path.equals("/api/tasks/")) {
            if ("GET".equals(method)) {
                handleGetTasks(exchange);
            } else if ("POST".equals(method)) {
                handlePostTask(exchange);
            } else {
                sendErrorResponse(exchange, 405, "Method Not Allowed");
            }
        } else if (path.startsWith("/api/tasks/")) {
            String idStr = path.substring("/api/tasks/".length());
            try {
                int id = Integer.parseInt(idStr);
                if ("PUT".equals(method)) {
                    handlePutTask(exchange, id);
                } else if ("DELETE".equals(method)) {
                    handleDeleteTask(exchange, id);
                } else {
                    sendErrorResponse(exchange, 405, "Method Not Allowed");
                }
            } catch (NumberFormatException e) {
                sendErrorResponse(exchange, 400, "Invalid Task ID: " + idStr);
            }
        } else {
            sendErrorResponse(exchange, 404, "Not Found");
        }
    }

    private static void handleGetTasks(HttpExchange exchange) throws Exception {
        List<Task> tasks = taskDAO.getAllTasks();
        String jsonResponse = JsonUtils.toJson(tasks);
        byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, responseBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBytes);
        }
    }

    private static void handlePostTask(HttpExchange exchange) throws Exception {
        String requestBody = readRequestBody(exchange);
        Task task = JsonUtils.parseTask(requestBody);
        
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            sendErrorResponse(exchange, 400, "Task title is required");
            return;
        }
        
        taskDAO.addTask(task);
        
        String jsonResponse = JsonUtils.toJson(task);
        byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(201, responseBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBytes);
        }
    }

    private static void handlePutTask(HttpExchange exchange, int id) throws Exception {
        String requestBody = readRequestBody(exchange);
        String status = JsonUtils.parseStatus(requestBody);
        
        if (status == null || status.trim().isEmpty()) {
            sendErrorResponse(exchange, 400, "Task status is required");
            return;
        }
        
        taskDAO.updateTaskStatus(id, status);
        
        String jsonResponse = "{\"status\":\"" + escapeJson(status) + "\"}";
        byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, responseBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBytes);
        }
    }

    private static void handleDeleteTask(HttpExchange exchange, int id) throws Exception {
        taskDAO.deleteTask(id);
        
        String jsonResponse = "{\"deleted\":true,\"id\":" + id + "}";
        byte[] responseBytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, responseBytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(responseBytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = is.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            return bos.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendErrorResponse(HttpExchange exchange, int statusCode, String message) {
        try {
            setCorsHeaders(exchange);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            String jsonError = "{\"error\":\"" + escapeJson(message) + "\"}";
            byte[] responseBytes = jsonError.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
