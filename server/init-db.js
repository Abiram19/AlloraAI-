import "dotenv/config";
import sql from "./configs/db.js";

async function initializeDatabase() {
  try {
    console.log("Creating tables...");
    
    // Create creations table
    await sql`
      CREATE TABLE IF NOT EXISTS creations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        prompt TEXT,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        publish BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log("✓ creations table created successfully");
    
    // Create users table if needed
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log("✓ users table created successfully");
    
    console.log("Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
