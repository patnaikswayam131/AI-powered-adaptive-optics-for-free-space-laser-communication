// ============================================================================
// Beam Propagation Module
// ============================================================================
// Implements a Gaussian beam profile combined with Fraunhofer (far-field)
// diffraction to compute the point-spread function (PSF) from a phase screen.
//
// Key physics:
//   • E_pupil = A(x,y) · exp(i·φ(x,y))      (complex field in pupil plane)
//   • E_far   = FFT{ E_pupil }                (Fraunhofer approximation)
//   • I       = |E_far|²                      (intensity / PSF)
//   • Strehl  = max(I_distorted) / max(I_ideal)
//
// This directly connects phase aberrations to image quality - intensity is
// NOT generated independently from phase (fixes Flaw 2).
//
// Dependencies: fft-utils.js (fft2Complex, fftShift)
// ============================================================================

/**
 * Generate a 2D Gaussian beam amplitude profile.
 *
 * @param {number} N     - grid side length
 * @param {number} [sigma] - beam 1/e² radius in pixels (default 0.3·N)
 * @returns {Float64Array} - flat NxN array of amplitude values
 */
function gaussianBeam(N, sigma) {
  if (!sigma) sigma = 0.3 * N;
  var cx = N / 2;
  var cy = N / 2;
  var beam = new Float64Array(N * N);

  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var di = i - cx;
      var dj = j - cy;
      beam[i * N + j] = Math.exp(-(di * di + dj * dj) / (2 * sigma * sigma));
    }
  }
  return beam;
}

/**
 * Compute the far-field intensity (PSF) from a wavefront phase screen using
 * Fraunhofer diffraction.
 *
 * @param {number[]|Float64Array} phase - flat NxN phase array [radians]
 * @param {number} N - grid side length (power of 2)
 * @param {number} [sigma] - beam radius in pixels
 * @returns {{intensity: number[], strehl: number, peakReduction: number, beamRadius: number}}
 *   intensity   - normalised NxN PSF (peak = 1)
 *   strehl      - Strehl ratio (0–1)
 *   peakReduction - raw peak ratio (distorted / ideal)
 *   beamRadius  - intensity-weighted second moment spot radius in pixels
 */
function forwardModel(phase, N, sigma) {
  // 1. Gaussian aperture amplitude
  var amplitude = gaussianBeam(N, sigma);

  // 2. Complex pupil field: E = A · exp(iφ)
  var complexField = new Array(N * N);
  for (var k = 0; k < N * N; k++) {
    complexField[k] = {
      re: amplitude[k] * Math.cos(phase[k]),
      im: amplitude[k] * Math.sin(phase[k])
    };
  }

  // 3. Propagate to far field via 2D FFT
  var farField = fft2Complex(complexField, N);

  // 4. Intensity = |E_far|², then shift DC to centre
  var intensityRaw = new Array(N * N);
  for (var k = 0; k < N * N; k++) {
    intensityRaw[k] = farField[k].re * farField[k].re +
                      farField[k].im * farField[k].im;
  }
  var intensity = fftShift(intensityRaw, N);

  // 5. Peak of distorted PSF
  var maxI = 0;
  for (var k = 0; k < N * N; k++) {
    if (intensity[k] > maxI) maxI = intensity[k];
  }

  // 6. Normalise to [0, 1]
  var normalized = new Array(N * N);
  for (var k = 0; k < N * N; k++) {
    normalized[k] = maxI > 0 ? intensity[k] / maxI : 0;
  }

  // 7. Compute ideal (unaberrated) PSF for Strehl ratio
  var idealField = new Array(N * N);
  for (var k = 0; k < N * N; k++) {
    idealField[k] = { re: amplitude[k], im: 0 };
  }
  var idealFar = fft2Complex(idealField, N);

  var idealIntensityRaw = new Array(N * N);
  for (var k = 0; k < N * N; k++) {
    idealIntensityRaw[k] = idealFar[k].re * idealFar[k].re +
                           idealFar[k].im * idealFar[k].im;
  }
  var idealIntensity = fftShift(idealIntensityRaw, N);

  var maxIdeal = 0;
  for (var k = 0; k < N * N; k++) {
    if (idealIntensity[k] > maxIdeal) maxIdeal = idealIntensity[k];
  }

  // 8. Strehl = peak(distorted) / peak(ideal)
  var strehl = maxIdeal > 0 ? Math.min(1.0, maxI / maxIdeal) : 1;

  // 9. Compute beam radius (second moment)
  var beamRadius = computeBeamRadius(normalized, N);

  return {
    intensity: normalized,
    strehl: strehl,
    peakReduction: maxIdeal > 0 ? maxI / maxIdeal : 1,
    beamRadius: beamRadius
  };
}

/**
 * Compute the intensity-weighted second moment spot radius in pixels.
 *
 * @param {number[]} intensity - flat NxN normalized intensity array
 * @param {number} N - grid size
 * @returns {number} RMS radius in pixels
 */
function computeBeamRadius(intensity, N) {
  var cx = N / 2;
  var cy = N / 2;
  var sumI = 0;
  var sumR2I = 0;
  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var val = intensity[i * N + j];
      if (val > 0.01) { // threshold noise floor
        var r2 = (i - cy) * (i - cy) + (j - cx) * (j - cx);
        sumI += val;
        sumR2I += r2 * val;
      }
    }
  }
  return sumI > 1e-12 ? Math.sqrt(sumR2I / sumI) : 0;
}
