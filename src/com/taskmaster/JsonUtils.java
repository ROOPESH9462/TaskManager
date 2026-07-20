package com.taskmaster;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class JsonUtils {

    public static String toJson(Task task) {
        if (task == null) {
            return "null";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(task.getId() == null ? "null" : task.getId()).append(",");
        sb.append("\"title\":").append(task.getTitle() == null ? "null" : "\"" + escapeJson(task.getTitle()) + "\"").append(",");
        sb.append("\"description\":").append(task.getDescription() == null ? "null" : "\"" + escapeJson(task.getDescription()) + "\"").append(",");
        sb.append("\"status\":").append(task.getStatus() == null ? "null" : "\"" + escapeJson(task.getStatus()) + "\"").append(",");
        sb.append("\"dueDate\":").append(task.getDueDate() == null ? "null" : "\"" + escapeJson(task.getDueDate()) + "\"");
        sb.append("}");
        return sb.toString();
    }

    public static String toJson(List<Task> tasks) {
        if (tasks == null) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < tasks.size(); i++) {
            sb.append(toJson(tasks.get(i)));
            if (i < tasks.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    public static Task parseTask(String json) {
        Map<String, String> map = parseJsonToMap(json);
        Task task = new Task();
        
        String idStr = map.get("id");
        if (idStr != null) {
            try {
                task.setId(Integer.parseInt(idStr));
            } catch (NumberFormatException e) {
                // Ignore or leave as null
            }
        }
        
        task.setTitle(map.get("title"));
        task.setDescription(map.get("description"));
        task.setStatus(map.get("status"));
        task.setDueDate(map.get("dueDate"));
        
        return task;
    }

    public static String parseStatus(String json) {
        if (json == null) return null;
        json = json.trim();
        
        if (!json.startsWith("{")) {
            if (json.startsWith("\"") && json.endsWith("\"")) {
                return json.substring(1, json.length() - 1);
            }
            return json;
        }
        
        Map<String, String> map = parseJsonToMap(json);
        String status = map.get("status");
        if (status != null) {
            if (status.trim().startsWith("{")) {
                return parseStatus(status);
            }
            return status;
        }
        return null;
    }

    public static Map<String, String> parseJsonToMap(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null) return map;
        json = json.trim();
        if (!json.startsWith("{") || !json.endsWith("}")) {
            return map;
        }
        
        String content = json.substring(1, json.length() - 1).trim();
        int idx = 0;
        int len = content.length();
        while (idx < len) {
            while (idx < len && Character.isWhitespace(content.charAt(idx))) {
                idx++;
            }
            if (idx >= len) break;
            
            if (content.charAt(idx) != '"') {
                idx++;
                continue;
            }
            idx++; // Skip opening quote of key
            
            StringBuilder keyBuilder = new StringBuilder();
            while (idx < len && content.charAt(idx) != '"') {
                if (content.charAt(idx) == '\\') {
                    idx++;
                    if (idx < len) keyBuilder.append(content.charAt(idx));
                } else {
                    keyBuilder.append(content.charAt(idx));
                }
                idx++;
            }
            idx++; // Skip closing quote of key
            
            while (idx < len && content.charAt(idx) != ':') {
                idx++;
            }
            idx++; // Skip ':'
            
            while (idx < len && Character.isWhitespace(content.charAt(idx))) {
                idx++;
            }
            if (idx >= len) break;
            
            char valChar = content.charAt(idx);
            String value = null;
            if (valChar == '"') {
                idx++; // Skip opening quote of value
                StringBuilder valBuilder = new StringBuilder();
                while (idx < len && content.charAt(idx) != '"') {
                    if (content.charAt(idx) == '\\') {
                        idx++;
                        if (idx < len) {
                            char next = content.charAt(idx);
                            if (next == 'n') valBuilder.append('\n');
                            else if (next == 't') valBuilder.append('\t');
                            else if (next == 'r') valBuilder.append('\r');
                            else if (next == 'b') valBuilder.append('\b');
                            else if (next == 'f') valBuilder.append('\f');
                            else valBuilder.append(next);
                        }
                    } else {
                        valBuilder.append(content.charAt(idx));
                    }
                    idx++;
                }
                idx++; // Skip closing quote of value
                value = valBuilder.toString();
            } else if (valChar == '{') {
                int braceCount = 1;
                int startIdx = idx;
                idx++;
                while (idx < len && braceCount > 0) {
                    char c = content.charAt(idx);
                    if (c == '{') braceCount++;
                    else if (c == '}') braceCount--;
                    idx++;
                }
                value = content.substring(startIdx, idx);
            } else if (valChar == '[') {
                int bracketCount = 1;
                int startIdx = idx;
                idx++;
                while (idx < len && bracketCount > 0) {
                    char c = content.charAt(idx);
                    if (c == '[') bracketCount++;
                    else if (c == ']') bracketCount--;
                    idx++;
                }
                value = content.substring(startIdx, idx);
            } else {
                int startIdx = idx;
                while (idx < len && content.charAt(idx) != ',' && !Character.isWhitespace(content.charAt(idx))) {
                    idx++;
                }
                String raw = content.substring(startIdx, idx).trim();
                if ("null".equals(raw)) {
                    value = null;
                } else {
                    value = raw;
                }
            }
            
            map.put(keyBuilder.toString(), value);
            
            while (idx < len && content.charAt(idx) != ',') {
                idx++;
            }
            idx++; // Skip comma
        }
        return map;
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
}
