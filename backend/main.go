package main

import (
	"log"
	"os"

	"arche/backend/config"
	"arche/backend/handlers"
	"arche/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 1. Inisialisasi koneksi SQLite, migrasi GORM, dan seeding default administrator
	config.ConnectDB()

	// 2. Inisialisasi Fiber Application
	app := fiber.New(fiber.Config{
		AppName: "Arche Research Assistant API v1.0",
	})

	// 3. Registrasi Middleware Logging & CORS (Cross-Origin Resource Sharing)
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://127.0.0.1:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// 4. Struktur Routing API Arche
	api := app.Group("/api")

	// Rute Autentikasi & Sesi
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Post("/logout", handlers.Logout)
	auth.Get("/me", middleware.JWTMiddleware, handlers.Me)

	// Rute Manajemen Proyek Penelitian (Protected / Wajib Login)
	projects := api.Group("/projects", middleware.JWTMiddleware)
	projects.Get("/", handlers.ListProjects)
	projects.Post("/", handlers.CreateProject)
	projects.Get("/:id", handlers.GetProject)
	projects.Put("/:id", handlers.UpdateProject)
	projects.Delete("/:id", handlers.DeleteProject)
	projects.Put("/:id/design", handlers.UpdateResearchDesign)
	projects.Get("/:id/export", handlers.ExportChapter3)

	// Rute Panel Kontrol Administrator (Double Protection: Wajib Login & Wajib Role Admin)
	admin := api.Group("/admin", middleware.JWTMiddleware, middleware.AdminMiddleware)
	admin.Get("/stats", handlers.GetStats)
	admin.Get("/users", handlers.ListUsers)
	admin.Get("/projects", handlers.ListAllProjects)
	admin.Post("/db/vacuum", handlers.VacuumDatabase)

	// 5. Jalankan server pada port yang ditentukan
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server API Arche berjalan aktif pada port %s...", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Gagal menjalankan server API: %v", err)
	}
}
