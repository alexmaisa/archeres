package config

import (
	"log"
	"os"

	"archeres/backend/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB holds the database connection instance
var DB *gorm.DB

// ConnectDB establishes the connection to SQLite, runs migrations, and configures the instance
func ConnectDB() {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "archeres.db"
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("SQLite database connection established successfully.")

	// Retrieve underlying sql.DB instance to configure SQLite driver settings
	sqlDB, err := DB.DB()
	if err == nil {
		// Enable Write-Ahead Logging (WAL) mode for concurrency optimization
		sqlDB.Exec("PRAGMA journal_mode=WAL;")
		// Set a busy timeout of 5000ms before returning SQLITE_BUSY error
		sqlDB.Exec("PRAGMA busy_timeout=5000;")
		// Set pool limits appropriate for SQLite file-based database
		sqlDB.SetMaxOpenConns(10)
		sqlDB.SetMaxIdleConns(5)
		log.Println("SQLite WAL mode and busy_timeout configured successfully.")
	} else {
		log.Printf("Warning: Failed to retrieve raw database connection for SQLite tuning: %v", err)
	}

	// Auto-migrate our models
	err = DB.AutoMigrate(&models.User{}, &models.Project{}, &models.ResearchDesign{}, &models.LoginTelemetry{})
	if err != nil {
		log.Fatalf("Database auto-migration failed: %v", err)
	}
	log.Println("Database schema auto-migrated successfully.")
}
