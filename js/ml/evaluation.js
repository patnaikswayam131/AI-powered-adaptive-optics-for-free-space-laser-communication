// Model Evaluation Module
// Implements proper train/test split and honest metrics
// Fixes Flaw 5: Real train/test split (not test=copy of train)
// Fixes Flaw 8: RMSE computed on TEST SET ONLY

function trainTestSplit(X, y, testFraction) {
  if (!testFraction) testFraction = 0.25;
  const n = X.length;
  
  // Create shuffled index array (Fisher-Yates with seeded random)
  const indices = Array.from({length: n}, (_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const nTest = Math.max(1, Math.floor(n * testFraction));
  const testIdx = indices.slice(0, nTest);
  const trainIdx = indices.slice(nTest);
  
  return {
    X_train: trainIdx.map(i => [...X[i]]),
    y_train: trainIdx.map(i => [...y[i]]),
    X_test: testIdx.map(i => [...X[i]]),
    y_test: testIdx.map(i => [...y[i]]),
    nTrain: trainIdx.length,
    nTest: testIdx.length
  };
}

function evaluateModel(model, X_data, y_data) {
  const y_pred = model.predict(X_data);
  const nSamples = y_data.length;
  const nOutputs = y_data[0].length;
  
  // RMSE across all samples and outputs
  let sumSqErr = 0;
  let count = 0;
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < nOutputs; j++) {
      const err = y_pred[i][j] - y_data[i][j];
      sumSqErr += err * err;
      count++;
    }
  }
  const rmse = Math.sqrt(sumSqErr / count);
  
  // R² score
  const yMean = columnMeans(y_data);
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < nOutputs; j++) {
      ssTot += Math.pow(y_data[i][j] - yMean[j], 2);
      ssRes += Math.pow(y_pred[i][j] - y_data[i][j], 2);
    }
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  
  // Per-mode RMSE for diagnostics
  const modeRMSE = [];
  for (let j = 0; j < nOutputs; j++) {
    let modeSqErr = 0;
    for (let i = 0; i < nSamples; i++) {
      modeSqErr += Math.pow(y_pred[i][j] - y_data[i][j], 2);
    }
    modeRMSE.push(Math.sqrt(modeSqErr / nSamples));
  }
  
  return {
    rmse,
    r2,
    y_pred,
    nSamples,
    modeRMSE
  };
}
