package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a registered researcher or administrator in the system
type User struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	Name             string     `gorm:"not null" json:"name"`
	Email            string     `gorm:"unique;not null" json:"email"`
	Password         string     `gorm:"not null" json:"-"`
	Role             string     `gorm:"default:user;not null" json:"role"` // 'user' or 'admin'
	ResetToken       *string    `json:"-"`
	ResetTokenExpiry *time.Time `json:"-"`
	// E2EE Key Vault: stores AES-256-GCM wrapped Master Encryption Key (MEK)
	PasswordVault string `gorm:"not null;default:''" json:"passwordVault"` // MEK wrapped with password-derived key
	RecoveryVault string `gorm:"not null;default:''" json:"recoveryVault"` // MEK wrapped with recovery-key-derived key
	VaultSalt     string `gorm:"not null;default:''" json:"vaultSalt"`     // PBKDF2 salt (base64, 32 bytes)
	Projects      []Project  `gorm:"foreignKey:UserID" json:"projects,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// Project represents a research draft created by a User
type Project struct {
	ID             string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Title          string         `gorm:"not null" json:"title"`
	Description    string         `json:"description"`
	UserID         uint           `gorm:"not null" json:"userId"`
	User           *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ResearchDesign ResearchDesign `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"researchDesign"`
	IsArchived     bool           `gorm:"default:false;not null" json:"isArchived"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
}

// BeforeCreate is a GORM hook that auto-generates a cryptographically secure random UUID string for the Project before saving it to the database.
func (p *Project) BeforeCreate(tx *gorm.DB) (err error) {
	p.ID = uuid.New().String()
	return
}

// ResearchDesign stores all methodology decisions, sample size calculation outputs,
// variable mappings, and analytical recommendations for a specific Project
type ResearchDesign struct {
	ID               uint    `gorm:"primaryKey" json:"id"`
	ProjectID        string  `gorm:"unique;not null;type:varchar(36)" json:"projectId"`
	Approach         string  `json:"approach"`         // Quantitative, Qualitative, Mixed
	DesignType       string  `json:"designType"`       // e.g. Experimental, Quasi-Experimental, Case Study, Phenomenology
	FormulaType      string  `json:"formulaType"`      // e.g. Slovin, Cochran, Lemeshow, Krejcie-Morgan, Yamane, Daniel
	PopulationSize   int     `json:"populationSize"`   // Used for finite formulas
	ConfidenceLevel  float64 `json:"confidenceLevel"`  // e.g. 95, 99
	MarginOfError    float64 `json:"marginOfError"`    // e.g. 0.05
	CalculatedSample int     `json:"calculatedSample"` // Final calculated output
	Variables        string  `json:"variables"`        // JSON string mapping variables, measurement scales, and indicators
	AnalysisMethod   string  `json:"analysisMethod"`   // Recommended analytical testing
	SamplingTechnique string  `json:"samplingTechnique"` // e.g. Simple Random, Stratified Random, Purposive, Snowball
	IsPopulationKnown bool    `json:"isPopulationKnown"` // e.g. true (finite), false (infinite)
}

// LoginTelemetry represents a secure, zero-identity log of a user login session
type LoginTelemetry struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
}
