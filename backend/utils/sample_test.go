package utils

import (
	"testing"
)

// TestCalculateSlovin verifies Slovin/Yamane calculations against standard benchmarks
func TestCalculateSlovin(t *testing.T) {
	tests := []struct {
		N        int
		e        float64
		expected int
	}{
		{N: 1000, e: 0.05, expected: 286}, // 1000 / (1 + 1000 * 0.0025) = 285.71 -> 286
		{N: 500, e: 0.05, expected: 223},  // 500 / (1 + 500 * 0.0025) = 222.22 -> 223
		{N: 100, e: 0.10, expected: 50},   // 100 / (1 + 100 * 0.01) = 50.00 -> 50
		{N: 0, e: 0.05, expected: 0},
		{N: 1000, e: -0.05, expected: 0},
	}

	for _, tt := range tests {
		result := CalculateSlovin(tt.N, tt.e)
		if result != tt.expected {
			t.Errorf("CalculateSlovin(N=%d, e=%.2f) = %d; ingin %d", tt.N, tt.e, result, tt.expected)
		}
	}
}

// TestCalculateCochran verifies Cochran infinite population formula
func TestCalculateCochran(t *testing.T) {
	tests := []struct {
		z        float64
		p        float64
		e        float64
		expected int
	}{
		{z: 1.96, p: 0.5, e: 0.05, expected: 385}, // (1.96^2 * 0.25) / 0.0025 = 384.16 -> 385
		{z: 2.576, p: 0.5, e: 0.05, expected: 664}, // (2.576^2 * 0.25) / 0.0025 = 663.58 -> 664
		{z: 1.96, p: 0.5, e: 0.10, expected: 97},   // (1.96^2 * 0.25) / 0.01 = 96.04 -> 97
	}

	for _, tt := range tests {
		result := CalculateCochran(tt.z, tt.p, tt.e)
		if result != tt.expected {
			t.Errorf("CalculateCochran(z=%.3f, p=%.2f, e=%.2f) = %d; ingin %d", tt.z, tt.p, tt.e, result, tt.expected)
		}
	}
}

// TestCalculateKrejcieMorgan verifies calculations against original 1970 publication tables
func TestCalculateKrejcieMorgan(t *testing.T) {
	tests := []struct {
		N               int
		confidenceLevel float64
		d               float64
		expected        int
	}{
		{N: 100, confidenceLevel: 95, d: 0.05, expected: 80},     // Standard Krejcie table value for N=100 is 80
		{N: 500, confidenceLevel: 95, d: 0.05, expected: 218},    // Mathematically 217.47. Rounded up to 218 using scientific Ceil. (Original table lists 217 via truncation).
		{N: 10000, confidenceLevel: 95, d: 0.05, expected: 370},  // Standard Krejcie table value for N=10000 is 370
	}

	for _, tt := range tests {
		result := CalculateKrejcieMorgan(tt.N, tt.confidenceLevel, tt.d)
		if result != tt.expected {
			t.Errorf("CalculateKrejcieMorgan(N=%d, CL=%.0f, d=%.2f) = %d; ingin %d", tt.N, tt.confidenceLevel, tt.d, result, tt.expected)
		}
	}
}

// TestCalculateLemeshow verifies WHO Lemeshow calculations with finite corrections
func TestCalculateLemeshow(t *testing.T) {
	// Infinite population Lemeshow:
	// z = 1.96, P = 0.5, d = 0.05 -> Should be equal to Cochran (385)
	infResult := CalculateLemeshow(1.96, 0.5, 0.05, 0)
	if infResult != 385 {
		t.Errorf("Lemeshow unknown population = %d; want 385", infResult)
	}

	// Finite population Lemeshow correction:
	// N = 1000, z = 1.96, P = 0.5, d = 0.05
	// n0 = 385
	// n = 385 / (1 + (384/1000)) = 385 / 1.384 = 278.18 -> 279
	finResult := CalculateLemeshow(1.96, 0.5, 0.05, 1000)
	if finResult != 279 {
		t.Errorf("Lemeshow known population (N=1000) = %d; want 279", finResult)
	}
}

// TestCalculateDaniel verifies that Daniel's formula calculation yields expected values
func TestCalculateDaniel(t *testing.T) {
	// Unknown population Daniel (should match Cochran/Lemeshow infinite)
	infResult := CalculateDaniel(1.96, 0.5, 0.05, 0)
	if infResult != 385 {
		t.Errorf("CalculateDaniel unknown population = %d; want 385", infResult)
	}

	// Known population Daniel (should match Lemeshow finite correction)
	finResult := CalculateDaniel(1.96, 0.5, 0.05, 1000)
	if finResult != 279 {
		t.Errorf("CalculateDaniel known population (N=1000) = %d; want 279", finResult)
	}
}

// TestCalculateYamane verifies that Yamane's formula matches Slovin's calculations
func TestCalculateYamane(t *testing.T) {
	result := CalculateYamane(1000, 0.05)
	expected := CalculateSlovin(1000, 0.05)
	if result != expected {
		t.Errorf("CalculateYamane(N=1000, e=0.05) = %d; want %d (matching Slovin)", result, expected)
	}
}

