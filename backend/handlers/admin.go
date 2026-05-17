package handlers

import (
	"os"
	"time"

	"arche/backend/config"
	"arche/backend/models"
	"github.com/gofiber/fiber/v2"
)

// UserAdminResponse models researcher profiles customized for administrative panels
type UserAdminResponse struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Role         string    `json:"role"`
	ProjectCount int64     `json:"projectCount"`
	CreatedAt    time.Time `json:"createdAt"`
}

// GetStats returns global analytical and system metric statistics
func GetStats(c *fiber.Ctx) error {
	var totalUsers int64
	config.DB.Model(&models.User{}).Where("role = ?", "user").Count(&totalUsers)

	var totalProjects int64
	config.DB.Model(&models.Project{}).Count(&totalProjects)

	// Count by approach type
	var quantCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("approach = ?", "Kuantitatif").Count(&quantCount)

	var qualCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("approach = ?", "Kualitatif").Count(&qualCount)

	var mixedCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("approach = ?", "Metode Campuran").Count(&mixedCount)

	// Count by formula calculation model
	var slovinCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("formula_type = ?", "Slovin").Count(&slovinCount)

	var cochranCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("formula_type = ?", "Cochran").Count(&cochranCount)

	var lemeshowCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("formula_type = ?", "Lemeshow").Count(&lemeshowCount)

	var krejcieCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("formula_type = ?", "Krejcie-Morgan").Count(&krejcieCount)

	var yamaneCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("formula_type = ?", "Yamane").Count(&yamaneCount)

	var danielCount int64
	config.DB.Model(&models.ResearchDesign{}).Where("formula_type = ?", "Daniel").Count(&danielCount)

	// Fetch dynamic database size for resource profiling
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "arche.db"
	}
	var dbSize int64
	fileInfo, err := os.Stat(dbPath)
	if err == nil {
		dbSize = fileInfo.Size()
	}

	return c.JSON(fiber.Map{
		"totalUsers":    totalUsers,
		"totalProjects": totalProjects,
		"dbSizeBytes":   dbSize,
		"approachStats": fiber.Map{
			"kuantitatif":    quantCount,
			"kualitatif":     qualCount,
			"metodeCampuran": mixedCount,
		},
		"formulaStats": fiber.Map{
			"slovin":        slovinCount,
			"cochran":       cochranCount,
			"lemeshow":      lemeshowCount,
			"krejcieMorgan": krejcieCount,
			"yamane":        yamaneCount,
			"daniel":        danielCount,
		},
	})
}

// ListUsers retrieves all registered accounts paired with active study counts
func ListUsers(c *fiber.Ctx) error {
	var users []models.User
	if err := config.DB.Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil daftar seluruh pengguna platform.",
		})
	}

	var response []UserAdminResponse
	for _, u := range users {
		var projectCount int64
		config.DB.Model(&models.Project{}).Where("user_id = ?", u.ID).Count(&projectCount)

		response = append(response, UserAdminResponse{
			ID:           u.ID,
			Name:         u.Name,
			Email:        u.Email,
			Role:         u.Role,
			ProjectCount: projectCount,
			CreatedAt:    u.CreatedAt,
		})
	}

	return c.JSON(response)
}

// ListAllProjects loads a master overview of all study projects registered on the system
func ListAllProjects(c *fiber.Ctx) error {
	var projects []models.Project
	if err := config.DB.Preload("ResearchDesign").Preload("User").Order("updated_at desc").Find(&projects).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal memproses prapemuatan draf penelitian di server.",
		})
	}

	return c.JSON(projects)
}
