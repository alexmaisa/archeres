package handlers

import (
	"encoding/json"
	"fmt"
	"strconv"

	"archeres/backend/config"
	"archeres/backend/models"
	"github.com/gofiber/fiber/v2"
)

// ProjectInput represents parameters to create or update a project
type ProjectInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// ResearchDesignInput models parameters for saving the research methodology wizard choices
type ResearchDesignInput struct {
	Approach         string  `json:"approach"`
	DesignType       string  `json:"designType"`
	FormulaType      string  `json:"formulaType"`
	PopulationSize   int     `json:"populationSize"`
	ConfidenceLevel  float64 `json:"confidenceLevel"`
	MarginOfError    float64 `json:"marginOfError"`
	CalculatedSample int     `json:"calculatedSample"`
	Variables        string  `json:"variables"` // Expected JSON array string
	AnalysisMethod   string  `json:"analysisMethod"`
}

// ListProjects retrieves all projects belonging to the logged-in user
func ListProjects(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var projects []models.Project
	if err := config.DB.Where("user_id = ?", userID).Preload("ResearchDesign").Order("updated_at desc").Find(&projects).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil daftar proyek.",
		})
	}

	return c.JSON(projects)
}

// CreateProject creates a new project and initializes an empty research design
func CreateProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var input ProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format data input tidak valid.",
		})
	}

	if input.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Judul penelitian wajib diisi.",
		})
	}

	project := models.Project{
		Title:       input.Title,
		Description: input.Description,
		UserID:      userID,
	}

	// Save project
	if err := config.DB.Create(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menyimpan draf proyek baru.",
		})
	}

	// Initialize associated ResearchDesign
	design := models.ResearchDesign{
		ProjectID:        project.ID,
		Approach:         "Kuantitatif", // default
		DesignType:       "Belum ditentukan",
		FormulaType:      "Slovin",
		PopulationSize:   100,
		ConfidenceLevel:  95.0,
		MarginOfError:    0.05,
		CalculatedSample: 0,
		Variables:        "[]",
		AnalysisMethod:   "Belum ditentukan",
	}

	if err := config.DB.Create(&design).Error; err != nil {
		// Rollback project creation to maintain integrity
		config.DB.Delete(&project)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menginisialisasi parameter desain penelitian.",
		})
	}

	project.ResearchDesign = design
	return c.Status(fiber.StatusCreated).JSON(project)
}

// GetProject loads a specific project with preloaded research design details
func GetProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID Proyek tidak valid.",
		})
	}

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).Preload("ResearchDesign").First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Proyek tidak ditemukan atau Anda tidak memiliki akses.",
		})
	}

	return c.JSON(project)
}

// UpdateProject updates the title and description of a project
func UpdateProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID Proyek tidak valid.",
		})
	}

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Proyek tidak ditemukan.",
		})
	}

	var input ProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format input data tidak valid.",
		})
	}

	if input.Title != "" {
		project.Title = input.Title
	}
	project.Description = input.Description

	if err := config.DB.Save(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal memperbarui data proyek.",
		})
	}

	return c.JSON(project)
}

// DeleteProject deletes a project (cascades associated ResearchDesign)
func DeleteProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID Proyek tidak valid.",
		})
	}

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Proyek tidak ditemukan.",
		})
	}

	if err := config.DB.Delete(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menghapus proyek.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Proyek berhasil dihapus.",
	})
}

// UpdateResearchDesign updates the step-by-step wizard details for a project
func UpdateResearchDesign(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID Proyek tidak valid.",
		})
	}

	// Verify project ownership
	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Proyek tidak ditemukan.",
		})
	}

	var input ResearchDesignInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format input data desain tidak valid.",
		})
	}

	var design models.ResearchDesign
	if err := config.DB.Where("project_id = ?", projectID).First(&design).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Parameter desain tidak ditemukan.",
		})
	}

	// Save fields
	design.Approach = input.Approach
	design.DesignType = input.DesignType
	design.FormulaType = input.FormulaType
	design.PopulationSize = input.PopulationSize
	design.ConfidenceLevel = input.ConfidenceLevel
	design.MarginOfError = input.MarginOfError
	design.CalculatedSample = input.CalculatedSample
	design.Variables = input.Variables
	design.AnalysisMethod = input.AnalysisMethod

	if err := config.DB.Save(&design).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal memperbarui parameter desain penelitian.",
		})
	}

	return c.JSON(design)
}

// VariableStruct defines internal layout to parse frontend mapped variables
type VariableStruct struct {
	Name       string `json:"name"`
	Role       string `json:"role"`
	Scale      string `json:"scale"`
	Indicators string `json:"indicators"`
}

// ExportChapter3 generates a styled, academic-grade Indonesian "Bab III: Metodologi Penelitian" draft
func ExportChapter3(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID Proyek tidak valid.",
		})
	}

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).Preload("ResearchDesign").First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Proyek tidak ditemukan.",
		})
	}

	d := project.ResearchDesign

	// Standard header
	markdown := fmt.Sprintf("# BAB III: METODOLOGI PENELITIAN\n\n")
	markdown += fmt.Sprintf("Draf BAB III metodologi penelitian ini dibuat secara otomatis melalui platform **Archeres** untuk mempermudah perumusan struktur metodologi pada proposal penelitian yang berjudul **\"%s\"**.\n\n", project.Title)

	// 3.1 Research Design
	markdown += "## 3.1 Pendekatan dan Desain Penelitian\n\n"
	markdown += fmt.Sprintf("Penelitian ini menggunakan pendekatan **%s**. ", d.Approach)
	if d.Approach == "Kuantitatif" {
		markdown += "Pendekatan kuantitatif dipilih karena penelitian ini berfokus pada pengujian teori atau hipotesis, melakukan pengukuran variabel secara numerik, serta melakukan analisis statistik untuk menguji hubungan atau perbedaan antar variabel. "
	} else if d.Approach == "Kualitatif" {
		markdown += "Pendekatan kualitatif digunakan untuk mengeksplorasi dan memahami makna, fenomena, atau interpretasi subjektif dari individu atau kelompok secara mendalam dalam latar alamiah. "
	} else {
		markdown += "Pendekatan metode campuran (Mixed Methods) menggabungkan kekuatan metode kuantitatif dan kualitatif secara berurutan atau bersamaan guna memperoleh pemahaman komprehensif terhadap masalah penelitian. "
	}
	markdown += fmt.Sprintf("Adapun desain penelitian spesifik yang diterapkan adalah **%s**. Desain ini disesuaikan untuk mencapai tujuan penelitian serta menjawab pertanyaan penelitian secara logis dan terstruktur.\n\n", d.DesignType)

	// 3.2 Population and Sample
	markdown += "## 3.2 Populasi dan Sampel Penelitian\n\n"
	if d.Approach == "Kualitatif" {
		markdown += "Dalam penelitian kualitatif, konsep sampel tidak merujuk pada representasi statistik, melainkan pada pemilihan informan kunci (*key informants*) yang kaya akan informasi. Pemilihan subjek penelitian dilakukan secara *purposive* berdasarkan kriteria inklusi tertentu untuk memperoleh pemahaman teoretis yang mendalam.\n\n"
	} else {
		markdown += fmt.Sprintf("Populasi sasaran dalam penelitian ini berjumlah **%d** subjek. ", d.PopulationSize)
		markdown += fmt.Sprintf("Penentuan jumlah sampel dilakukan secara ilmiah menggunakan **Formula %s** dengan tingkat kepercayaan (*Confidence Level*) sebesar **%.1f%%** serta tingkat toleransi kesalahan (*Margin of Error*) sebesar **%.1f%%**.\n\n", d.FormulaType, d.ConfidenceLevel, d.MarginOfError*100.0)
		markdown += fmt.Sprintf("Berdasarkan perhitungan formula tersebut, diperoleh jumlah sampel minimum sebanyak **%d** subjek. ", d.CalculatedSample)
		markdown += "Teknik pengambilan sampel (*sampling technique*) direncanakan menggunakan metode acak (*probability sampling*) atau non-acak (*non-probability sampling*) sesuai dengan karakteristik populasi untuk menjaga representativitas data.\n\n"
	}

	// 3.3 Variable Mapping
	markdown += "## 3.3 Identifikasi dan Operasionalisasi Variabel\n\n"
	var vars []VariableStruct
	if err := json.Unmarshal([]byte(d.Variables), &vars); err == nil && len(vars) > 0 {
		markdown += "Identifikasi variabel penelitian beserta skala pengukurannya dirinci pada tabel berikut:\n\n"
		markdown += "| Nama Variabel | Peran/Jenis | Skala Pengukuran | Indikator Utama |\n"
		markdown += "| :--- | :--- | :--- | :--- |\n"
		for _, v := range vars {
			markdown += fmt.Sprintf("| %s | %s | %s | %s |\n", v.Name, v.Role, v.Scale, v.Indicators)
		}
		markdown += "\n"
	} else {
		markdown += "Variabel penelitian belum diidentifikasi atau dipetakan di lembar kerja perencana variabel.\n\n"
	}

	// 3.4 Data Analysis
	markdown += "## 3.4 Metode Analisis Data\n\n"
	markdown += fmt.Sprintf("Untuk menjawab rumusan masalah serta menguji hipotesis penelitian yang telah diajukan, teknik analisis data yang direncanakan adalah **%s**.\n\n", d.AnalysisMethod)
	if d.Approach == "Kuantitatif" {
		markdown += "Sebelum melakukan uji analisis data utama (seperti uji korelasi atau regresi), data terlebih dahulu akan melewati serangkaian uji prasyarat analisis (asumsi klasik) meliputi uji normalitas, uji linearitas, serta uji homogenitas/heteroskedastisitas untuk memastikan bahwa estimator data bersifat linier dan tidak bias (*Best Linear Unbiased Estimator*)."
	} else {
		markdown += "Prosedur analisis data kualitatif akan dilakukan secara sirkular menggunakan model interaktif (reduksi data, penyajian data, serta penarikan kesimpulan) atau analisis tematik terstruktur untuk menghasilkan abstraksi konsep teoretis yang kuat dari data lapangan."
	}
	markdown += "\n"

	return c.JSON(fiber.Map{
		"title":    project.Title,
		"design":   d,
		"markdown": markdown,
	})
}
