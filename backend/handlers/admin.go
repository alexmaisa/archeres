package handlers

import (
	"os"
	"runtime"
	"time"

	"archeres/backend/config"
	"archeres/backend/models"
	"github.com/gofiber/fiber/v2"
)

var startTime = time.Now()

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

	var newUsers24h int64
	yesterday := time.Now().Add(-24 * time.Hour)
	config.DB.Model(&models.User{}).Where("role = ? AND created_at >= ?", "user", yesterday).Count(&newUsers24h)

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
		dbPath = "archeres.db"
	}
	var dbSize int64
	fileInfo, err := os.Stat(dbPath)
	if err == nil {
		dbSize = fileInfo.Size()
	}

	// Fetch system memory allocations & server uptime
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	allocatedRamMb := float64(m.Alloc) / 1024.0 / 1024.0
	serverUptimeSecs := int64(time.Since(startTime).Seconds())

	return c.JSON(fiber.Map{
		"totalUsers":       totalUsers,
		"totalProjects":    totalProjects,
		"newUsers24h":      newUsers24h,
		"dbSizeBytes":      dbSize,
		"allocatedRamMb":   allocatedRamMb,
		"serverUptimeSecs": serverUptimeSecs,
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

// ListUsers is deactivated to guarantee user privacy. Returns 403 Forbidden.
func ListUsers(c *fiber.Ctx) error {
	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
		"error": "Pemberitahuan: Akses daftar detail seluruh akun pengguna dinonaktifkan secara permanen demi menjaga privasi dan keamanan platform.",
	})
}

// ListAllProjects is deactivated to guarantee user privacy. Returns 403 Forbidden.
func ListAllProjects(c *fiber.Ctx) error {
	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
		"error": "Pemberitahuan: Akses daftar detail draf penelitian pengguna dinonaktifkan secara permanen demi menjaga privasi dan keamanan platform.",
	})
}

// SecureLookupUser searches for a single user by exact email match
func SecureLookupUser(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email pencarian wajib diisi.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Peneliti dengan alamat email tersebut tidak ditemukan.",
		})
	}

	var projectCount int64
	config.DB.Model(&models.Project{}).Where("user_id = ?", user.ID).Count(&projectCount)

	return c.JSON(fiber.Map{
		"id":           user.ID,
		"name":         user.Name,
		"email":        user.Email,
		"role":         user.Role,
		"projectCount": projectCount,
		"createdAt":    user.CreatedAt,
	})
}

// DeleteUserByAdmin deletes a user account and all their projects in a transaction
func DeleteUserByAdmin(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil || body.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email pengguna wajib diisi.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Akun pengguna tidak ditemukan.",
		})
	}

	// Prevent admin from deleting themselves
	currentUser := c.Locals("user").(models.User)
	if currentUser.ID == user.ID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Anda tidak dapat menghapus akun admin Anda sendiri.",
		})
	}

	// Start a transaction to ensure complete cascade deletion
	tx := config.DB.Begin()

	// 1. Delete all research designs belonging to user's projects
	var projectIds []uint
	tx.Model(&models.Project{}).Where("user_id = ?", user.ID).Pluck("id", &projectIds)
	if len(projectIds) > 0 {
		if err := tx.Where("project_id IN ?", projectIds).Delete(&models.ResearchDesign{}).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Gagal menghapus detail desain penelitian proyek.",
			})
		}
	}

	// 2. Delete all projects
	if err := tx.Where("user_id = ?", user.ID).Delete(&models.Project{}).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus proyek penelitian milik pengguna.",
		})
	}

	// 3. Delete the user
	if err := tx.Delete(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus akun pengguna dari database.",
		})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message": "Akun pengguna dan seluruh draf penelitian terkait berhasil dihapus secara bersih.",
	})
}

// UpdateUserRoleByAdmin alters a researcher system role
func UpdateUserRoleByAdmin(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := c.BodyParser(&body); err != nil || body.Email == "" || body.Role == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email dan peran baru wajib diisi.",
		})
	}

	if body.Role != "admin" && body.Role != "user" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Peran baru tidak valid. Gunakan 'admin' or 'user'.",
		})
	}

	var user models.User
	if err := config.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Akun pengguna tidak ditemukan.",
		})
	}

	// Prevent admin from changing their own role
	currentUser := c.Locals("user").(models.User)
	if currentUser.ID == user.ID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Anda tidak dapat mengubah peran administratif Anda sendiri.",
		})
	}

	user.Role = body.Role
	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal memperbarui peran pengguna di basis data.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Peran sistem pengguna berhasil diperbarui.",
		"role":    user.Role,
	})
}

// VacuumDatabase executes a physical database vacuuming on SQLite to reclaim unused blocks
func VacuumDatabase(c *fiber.Ctx) error {
	if err := config.DB.Exec("VACUUM").Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal merapikan (VACUUM) alokasi basis data SQLite.",
		})
	}

	// Fetch new db size
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "archeres.db"
	}
	var dbSize int64
	fileInfo, err := os.Stat(dbPath)
	if err == nil {
		dbSize = fileInfo.Size()
	}

	return c.JSON(fiber.Map{
		"message":     "Basis data SQLite berhasil dirapikan fisik (VACUUM) secara optimal.",
		"dbSizeBytes": dbSize,
	})
}
