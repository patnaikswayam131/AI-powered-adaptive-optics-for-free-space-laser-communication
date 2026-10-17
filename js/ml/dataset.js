// Dataset Generator
// Creates training data from independent turbulence realizations
// Fixes Flaw 4: Each sample is a physically independent scenario,
//               not pixels from one image

async function generateDataset(numRealizations, cn2, N, nSubap, distance, progressCallback) {
  const X = [];  // features: SH slope measurements
  const y = [];  // targets: Zernike coefficients
  const numModes = 15;  // Number of Zernike modes to fit
  const D = 0.15; // 15 cm receiver pupil aperture
  const dx = D / N;
  const L = distance || 1000;
  
  for (let r = 0; r < numRealizations; r++) {
    // Each realization = one independent turbulence scenario
    const { phase } = generateKolmogorovPhaseScreen(N, cn2, dx, L);
    const slopes = computeSHSlopes(phase, N, nSubap, cn2);
    const coeffs = projectOntoZernike(phase, N, numModes);
    
    X.push(slopes);      // Feature vector: 2*nSubap*nSubap = 32
    y.push(coeffs);      // Target vector: numModes = 15
    
    // Yield to browser to animate the live simulation preview
    if (progressCallback && (r % 2 === 0 || r === numRealizations - 1)) {
      progressCallback(`Generating realization ${r + 1}/${numRealizations}...`, r + 1, phase, slopes);
      await new Promise(resolve => setTimeout(resolve, 12));
    }
  }
  
  return { X, y };
  // X shape: (numRealizations, 32)
  // y shape: (numRealizations, 15)
}
