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

	// Auto-migrate our models
	err = DB.AutoMigrate(&models.User{}, &models.Project{}, &models.ResearchDesign{}, &models.LoginTelemetry{})
	if err != nil {
		log.Fatalf("Database auto-migration failed: %v", err)
	}
	log.Println("Database schema auto-migrated successfully.")
}
