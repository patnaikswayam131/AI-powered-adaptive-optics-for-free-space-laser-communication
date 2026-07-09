// Dataset Generator
// Creates training data from independent turbulence realizations
// Fixes Flaw 4: Each sample is a physically independent scenario,
//               not pixels from one image

async function generateDataset(numRealizations, cn2, N, nSubap, progressCallback) {
  const X = [];  // features: SH slope measurements
  const y = [];  // targets: Zernike coefficients
  const numModes = 15;  // Number of Zernike modes to fit
  
  for (let r = 0; r < numRealizations; r++) {
    // Each realization = one independent turbulence scenario
    const { phase } = generateKolmogorovPhaseScreen(N, cn2, 0.5);
    const slopes = computeSHSlopes(phase, N, nSubap, cn2);
    const coeffs = projectOntoZernike(phase, N, numModes);
    
    X.push(slopes);      // Feature vector: 2*nSubap*nSubap = 32
    y.push(coeffs);      // Target vector: numModes = 15
    
    // Yield to browser every realization to animate the live simulation preview
    if (progressCallback) {
      progressCallback(`Generating realization ${r + 1}/${numRealizations}...`, r + 1, phase, slopes);
      // Wait 25ms to let the user see the phase screens and Shack-Hartmann spots wobble
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  
  return { X, y };
  // X shape: (numRealizations, 32)
  // y shape: (numRealizations, 15)
}
