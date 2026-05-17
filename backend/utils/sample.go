package utils

import (
	"math"
)

// CalculateSlovin implements the Taro Yamane / Slovin formula: n = N / (1 + N * e^2)
func CalculateSlovin(N int, e float64) int {
	if N <= 0 || e <= 0 {
		return 0
	}
	denominator := 1.0 + float64(N)*(e*e)
	return int(math.Ceil(float64(N) / denominator))
}

// CalculateCochran implements Cochran's formula for infinite populations: n0 = (Z^2 * p * q) / e^2
func CalculateCochran(z float64, p float64, e float64) int {
	if e <= 0 || p < 0 || p > 1 {
		return 0
	}
	q := 1.0 - p
	return int(math.Ceil((z * z * p * q) / (e * e)))
}

// CalculateLemeshow implements WHO Lemeshow's formula for known and unknown populations.
// Unknown population uses infinite Cochran. Known population applies finite correction: n = n0 / (1 + (n0 - 1) / N)
func CalculateLemeshow(z float64, P float64, d float64, N int) int {
	n0 := CalculateCochran(z, P, d)
	if N <= 0 {
		return n0
	}
	denominator := 1.0 + (float64(n0-1) / float64(N))
	return int(math.Ceil(float64(n0) / denominator))
}

// CalculateKrejcieMorgan implements the Krejcie & Morgan formula:
// s = (X^2 * N * P * (1-P)) / (d^2 * (N-1) + X^2 * P * (1-P))
func CalculateKrejcieMorgan(N int, confidenceLevel float64, d float64) int {
	if N <= 0 || d <= 0 {
		return 0
	}
	// Chi-square for 1 degree of freedom: 95% -> 3.841, 99% -> 6.635
	chiSquare := 3.841
	if confidenceLevel == 99 {
		chiSquare = 6.635
	}
	P := 0.5 // Default proportion for maximum sample size
	numerator := chiSquare * float64(N) * P * (1.0 - P)
	denominator := (d * d * float64(N-1)) + (chiSquare * P * (1.0 - P))
	return int(math.Ceil(numerator / denominator))
}

// CalculateYamane is mathematically identical to Slovin's formula
func CalculateYamane(N int, d float64) int {
	return CalculateSlovin(N, d)
}

// CalculateDaniel implements Daniel's simple random sampling for estimating proportions
func CalculateDaniel(z float64, p float64, d float64, N int) int {
	return CalculateLemeshow(z, p, d, N)
}
