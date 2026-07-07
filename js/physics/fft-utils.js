// ============================================================================
// 2D FFT Utilities — wraps the fft.js library (loaded via CDN)
// ============================================================================
// fft.js provides:
//   new FFT(size)          — create transformer for given power-of-2 size
//   .transform(out, inp)   — forward FFT
//   .inverseTransform(out, inp) — inverse FFT
// Input/output format: interleaved Float64Array [re0, im0, re1, im1, ...]
//
// This module adds 2D operations on NxN grids:
//   fft2(realInput, N)          — 2D FFT of real-valued NxN array
//   fft2Complex(complexInput, N) — 2D FFT of complex-valued NxN array
//   ifft2(complexInput, N)      — inverse 2D FFT
//   fftShift(arr, N)            — swap quadrants so DC is centred
// ============================================================================

/**
 * 2D Fast Fourier Transform of a real-valued input.
 *
 * @param {number[]|Float64Array} realInput — flat array of N*N real values
 * @param {number} N — grid side length (must be power of 2)
 * @returns {Array<{re:number, im:number}>} — N*N complex values
 */
function fft2(realInput, N) {
  var fftObj = new FFT(N);

  // --- Step 1: FFT each row ---
  var rowFFT = new Float64Array(N * N * 2); // interleaved complex storage
  var rowIn  = new Float64Array(N * 2);
  var rowOut = new Float64Array(N * 2);

  for (var i = 0; i < N; i++) {
    // Pack row i as complex (imaginary = 0)
    for (var j = 0; j < N; j++) {
      rowIn[2 * j]     = realInput[i * N + j];
      rowIn[2 * j + 1] = 0;
    }
    fftObj.transform(rowOut, rowIn);
    // Store result
    for (var j = 0; j < N; j++) {
      rowFFT[(i * N + j) * 2]     = rowOut[2 * j];
      rowFFT[(i * N + j) * 2 + 1] = rowOut[2 * j + 1];
    }
  }

  // --- Step 2: FFT each column ---
  var result = new Float64Array(N * N * 2);
  var colIn  = new Float64Array(N * 2);
  var colOut = new Float64Array(N * 2);

  for (var j = 0; j < N; j++) {
    for (var i = 0; i < N; i++) {
      colIn[2 * i]     = rowFFT[(i * N + j) * 2];
      colIn[2 * i + 1] = rowFFT[(i * N + j) * 2 + 1];
    }
    fftObj.transform(colOut, colIn);
    for (var i = 0; i < N; i++) {
      result[(i * N + j) * 2]     = colOut[2 * i];
      result[(i * N + j) * 2 + 1] = colOut[2 * i + 1];
    }
  }

  // Convert interleaved → array of {re, im} objects
  var output = new Array(N * N);
  for (var k = 0; k < N * N; k++) {
    output[k] = { re: result[2 * k], im: result[2 * k + 1] };
  }
  return output;
}

/**
 * 2D FFT of a complex-valued input.
 *
 * @param {Array<{re:number, im:number}>} complexInput — N*N complex values
 * @param {number} N — grid side length (power of 2)
 * @returns {Array<{re:number, im:number}>}
 */
function fft2Complex(complexInput, N) {
  var fftObj = new FFT(N);

  // --- Row FFTs ---
  var rowFFT = new Array(N * N);
  var rowIn  = new Float64Array(N * 2);
  var rowOut = new Float64Array(N * 2);

  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      rowIn[2 * j]     = complexInput[i * N + j].re;
      rowIn[2 * j + 1] = complexInput[i * N + j].im;
    }
    fftObj.transform(rowOut, rowIn);
    for (var j = 0; j < N; j++) {
      rowFFT[i * N + j] = { re: rowOut[2 * j], im: rowOut[2 * j + 1] };
    }
  }

  // --- Column FFTs ---
  var output = new Array(N * N);
  var colIn  = new Float64Array(N * 2);
  var colOut = new Float64Array(N * 2);

  for (var j = 0; j < N; j++) {
    for (var i = 0; i < N; i++) {
      colIn[2 * i]     = rowFFT[i * N + j].re;
      colIn[2 * i + 1] = rowFFT[i * N + j].im;
    }
    fftObj.transform(colOut, colIn);
    for (var i = 0; i < N; i++) {
      output[i * N + j] = { re: colOut[2 * i], im: colOut[2 * i + 1] };
    }
  }
  return output;
}

/**
 * Inverse 2D FFT.
 *
 * @param {Array<{re:number, im:number}>} complexInput — N*N complex values
 * @param {number} N — grid side length (power of 2)
 * @returns {Array<{re:number, im:number}>}
 */
function ifft2(complexInput, N) {
  var fftObj = new FFT(N);

  // --- Row inverse FFTs ---
  var rowIFFT = new Array(N * N);
  var rowIn   = new Float64Array(N * 2);
  var rowOut  = new Float64Array(N * 2);

  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      rowIn[2 * j]     = complexInput[i * N + j].re;
      rowIn[2 * j + 1] = complexInput[i * N + j].im;
    }
    fftObj.inverseTransform(rowOut, rowIn);
    for (var j = 0; j < N; j++) {
      rowIFFT[i * N + j] = { re: rowOut[2 * j], im: rowOut[2 * j + 1] };
    }
  }

  // --- Column inverse FFTs ---
  var output = new Array(N * N);
  var colIn  = new Float64Array(N * 2);
  var colOut = new Float64Array(N * 2);

  for (var j = 0; j < N; j++) {
    for (var i = 0; i < N; i++) {
      colIn[2 * i]     = rowIFFT[i * N + j].re;
      colIn[2 * i + 1] = rowIFFT[i * N + j].im;
    }
    fftObj.inverseTransform(colOut, colIn);
    for (var i = 0; i < N; i++) {
      output[i * N + j] = { re: colOut[2 * i], im: colOut[2 * i + 1] };
    }
  }
  return output;
}

/**
 * Swap quadrants of an NxN array so DC component is centred.
 * Works on any flat array (real or object) of length N*N.
 *
 * @param {Array} arr — flat NxN array
 * @param {number} N  — grid side length
 * @returns {Array}   — quadrant-swapped copy
 */
function fftShift(arr, N) {
  var result = new Array(N * N);
  var half = Math.floor(N / 2);
  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      var si = (i + half) % N;
      var sj = (j + half) % N;
      result[si * N + sj] = arr[i * N + j];
    }
  }
  return result;
}
