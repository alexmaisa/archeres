package handlers

import (
	"archeres/backend/config"
	"archeres/backend/models"
	"github.com/gofiber/fiber/v2"
)


// ProjectInput represents parameters to create or update a project
type ProjectInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsArchived  *bool  `json:"isArchived"`
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
	SamplingTechnique string  `json:"samplingTechnique"`
	IsPopulationKnown bool    `json:"isPopulationKnown"`
}

// ListProjects retrieves all projects belonging to the logged-in user
func ListProjects(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var projects []models.Project
	if err := config.DB.Where("user_id = ?", userID).Preload("ResearchDesign").Order("updated_at desc").Find(&projects).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve projects list.",
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
			"error": "Invalid input data format.",
		})
	}

	if input.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Research title is required.",
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
			"error": "Failed to save new project draft.",
		})
	}

	// Initialize associated ResearchDesign
	design := models.ResearchDesign{
		ProjectID:        project.ID,
		Approach:         "Quantitative", // default
		DesignType:       "Undetermined",
		FormulaType:      "Slovin",
		PopulationSize:   100,
		ConfidenceLevel:  95.0,
		MarginOfError:    0.05,
		CalculatedSample: 0,
		Variables:        "[]",
		AnalysisMethod:   "Undetermined",
		SamplingTechnique: "Simple Random Sampling",
		IsPopulationKnown: true,
	}

	if err := config.DB.Create(&design).Error; err != nil {
		// Rollback project creation to maintain integrity
		config.DB.Delete(&project)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to initialize research design parameters.",
		})
	}

	project.ResearchDesign = design
	return c.Status(fiber.StatusCreated).JSON(project)
}

// GetProject loads a specific project with preloaded research design details
func GetProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID := c.Params("id")

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).Preload("ResearchDesign").First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Project not found or access denied.",
		})
	}

	return c.JSON(project)
}

// UpdateProject updates the title and description of a project
func UpdateProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID := c.Params("id")

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Project not found.",
		})
	}

	var input ProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input data format.",
		})
	}

	if input.Title != "" {
		project.Title = input.Title
	}
	if input.Description != "" {
		project.Description = input.Description
	}

	if input.IsArchived != nil {
		project.IsArchived = *input.IsArchived
	}

	if err := config.DB.Save(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update project data.",
		})
	}

	return c.JSON(project)
}

// DeleteProject deletes a project (cascades associated ResearchDesign)
func DeleteProject(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID := c.Params("id")

	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Project not found.",
		})
	}

	if err := config.DB.Delete(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete project.",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Project successfully deleted.",
	})
}

// UpdateResearchDesign updates the step-by-step wizard details for a project
func UpdateResearchDesign(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	projectID := c.Params("id")

	// Verify project ownership
	var project models.Project
	if err := config.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Project not found.",
		})
	}

	var input ResearchDesignInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid research design input format.",
		})
	}

	var design models.ResearchDesign
	if err := config.DB.Where("project_id = ?", projectID).First(&design).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Research design parameters not found.",
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
	design.SamplingTechnique = input.SamplingTechnique
	design.IsPopulationKnown = input.IsPopulationKnown

	if err := config.DB.Save(&design).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update research design parameters.",
		})
	}

	return c.JSON(design)
}

// VariableStruct defines internal layout to parse frontend mapped variables
