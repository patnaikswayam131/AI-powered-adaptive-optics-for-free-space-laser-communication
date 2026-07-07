// ============================================================================
// Shack-Hartmann Wavefront Sensor Simulator
// ============================================================================
// Models the standard AO wavefront sensor by dividing the pupil into a grid
// of subapertures and measuring the local wavefront slope (tilt) in each one.
//
// Key physics:
//   • Each subaperture images a portion of the wavefront
//   • The centroid shift of the focal spot ∝ local wavefront slope
//   • We compute this as the spatial gradient of the phase (finite differences)
//   • Sensor noise is modelled as additive Gaussian (photon-noise regime)
//
// This produces a slope vector of length 2·nSubap² suitable for the ML
// reconstruction pipeline (fixes Flaw 3: spatial gradient features, not
// single-pixel intensity).
//
// Dependencies: kolmogorov.js (gaussianRandom)
// ============================================================================

/**
 * Compute Shack-Hartmann slope measurements from a phase screen.
 *
 * @param {number[]|Float64Array} phase — flat NxN phase array [radians]
 * @param {number} N      — grid side length
 * @param {number} nSubap — number of subapertures per side (default 4)
 * @param {number} cn2    — Cn² value, used to scale sensor noise
 * @returns {number[]} — slope vector [sx_1, sx_2, …, sy_1, sy_2, …]
 *                        length = 2 · nSubap²
 */
function computeSHSlopes(phase, N, nSubap, cn2) {
  if (!nSubap) nSubap = 4;
  var subSize = Math.floor(N / nSubap);
  var slopesX = [];
  var slopesY = [];

  for (var si = 0; si < nSubap; si++) {
    for (var sj = 0; sj < nSubap; sj++) {
      // Accumulate finite-difference gradients across this subaperture
      var sumGradX = 0;
      var sumGradY = 0;
      var count = 0;

      for (var pi = 0; pi < subSize - 1; pi++) {
        for (var pj = 0; pj < subSize - 1; pj++) {
          var i = si * subSize + pi;
          var j = sj * subSize + pj;

          // Forward finite difference ∂φ/∂x and ∂φ/∂y
          var dPhiDx = phase[(i + 1) * N + j] - phase[i * N + j];
          var dPhiDy = phase[i * N + (j + 1)] - phase[i * N + j];

          sumGradX += dPhiDx;
          sumGradY += dPhiDy;
          count++;
        }
      }

      var meanGradX = count > 0 ? sumGradX / count : 0;
      var meanGradY = count > 0 ? sumGradY / count : 0;

      // Additive sensor noise — photon-noise approximation
      // Noise level scales with √(Cn² / reference_Cn²)
      var noiseLevel = 0.05 * Math.sqrt(cn2 / 1e-13);
      slopesX.push(meanGradX + gaussianRandom() * noiseLevel);
      slopesY.push(meanGradY + gaussianRandom() * noiseLevel);
    }
  }

  // Return concatenated vector: [all x-slopes, all y-slopes]
  // For nSubap = 4 this gives 2 × 16 = 32 elements
  return slopesX.concat(slopesY);
}
