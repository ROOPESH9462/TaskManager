package com.taskmaster;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConfig {
    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/taskmaster_db";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASS = "root";

    public static Connection getConnection() throws SQLException {
        String url = System.getenv("DB_URL");
        if (url == null || url.trim().isEmpty()) {
            url = DEFAULT_URL;
        }
        
        String user = System.getenv("DB_USER");
        if (user == null || user.trim().isEmpty()) {
            user = DEFAULT_USER;
        }
        
        String pass = System.getenv("DB_PASS");
        if (pass == null) {
            pass = DEFAULT_PASS;
        }

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            // Driver may be auto-loaded by JDBC 4.0 ServiceLoader
        }

        return DriverManager.getConnection(url, user, pass);
    }
}
