package main

import (
	"log"
	"os"

	"archeres/backend/config"
	"archeres/backend/handlers"
	"archeres/backend/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 1. Initialize SQLite connection, GORM migrations, and seed default administrator
	config.ConnectDB()

	// 2. Initialize Fiber Application
	app := fiber.New(fiber.Config{
		AppName: "Archeres Research Assistant API v1.0",
	})

	// 3. Register Logging & CORS (Cross-Origin Resource Sharing) Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://127.0.0.1:3000, http://192.168.20.11:3000, http://100.80.196.99:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// 4. Archeres API Routing Structure
	api := app.Group("/api")

	// Authentication & Session Routes
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Post("/logout", handlers.Logout)
	auth.Get("/me", middleware.JWTMiddleware, handlers.Me)
	auth.Post("/forgot-password", handlers.ForgotPassword)
	auth.Post("/reset-password", handlers.ResetPassword)
	auth.Post("/reset-vault", handlers.ResetVault)

	// Research Project Management Routes (Protected / Login Required)
	projects := api.Group("/projects", middleware.JWTMiddleware)
	projects.Get("/", handlers.ListProjects)
	projects.Post("/", handlers.CreateProject)
	projects.Get("/:id", handlers.GetProject)
	projects.Put("/:id", handlers.UpdateProject)
	projects.Delete("/:id", handlers.DeleteProject)
	projects.Put("/:id/design", handlers.UpdateResearchDesign)

	// Administrator Control Panel Routes (Double Protection: Login Required & Admin Role Required)
	admin := api.Group("/admin", middleware.JWTMiddleware, middleware.AdminMiddleware)
	admin.Get("/stats", handlers.GetStats)
	admin.Get("/users", handlers.ListUsers)
	admin.Get("/projects", handlers.ListAllProjects)
	admin.Post("/db/vacuum", handlers.VacuumDatabase)
	admin.Get("/user/lookup", handlers.SecureLookupUser)
	admin.Post("/user/delete", handlers.DeleteUserByAdmin)
	admin.Post("/user/role", handlers.UpdateUserRoleByAdmin)

	// 5. Run the server on the specified port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Archeres API server is running on port %s...", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to run API server: %v", err)
	}
}
