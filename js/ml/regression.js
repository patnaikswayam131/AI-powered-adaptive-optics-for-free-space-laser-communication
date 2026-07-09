// Ridge & Linear Regression
// Closed-form solution: β = (X'X + αI)^(-1) X'y
// Fixes Flaw 6: Implements actual mathematical regression, not a placeholder

function ridgeRegression(X_train, y_train, alpha) {
  // X_train: (n_samples, n_features) 2D array
  // y_train: (n_samples, n_outputs) 2D array
  // alpha: regularization strength (0 = linear regression)
  
  const n = X_train.length;
  const p = X_train[0].length;  // number of features
  
  // Compute X'X (p x p)
  const Xt = matTranspose(X_train);
  const XtX = matMul(Xt, X_train);
  
  // Add regularization: X'X + α*I
  for (let i = 0; i < p; i++) {
    XtX[i][i] += alpha;
  }
  
  // Compute X'y (p x q)
  const Xty = matMul(Xt, y_train);
  
  // Solve: β = (X'X + αI)^(-1) * X'y
  let XtXinv;
  let usedAlpha = alpha;
  try {
    XtXinv = matInvert(XtX);
  } catch (e) {
    // Matrix singular - auto-increase alpha and retry
    console.warn(`Matrix singular with α=${alpha}, auto-increasing to α=${alpha + 1.0}`);
    usedAlpha = alpha + 1.0;
    for (let i = 0; i < p; i++) {
      XtX[i][i] += 1.0;  // Add extra regularization
    }
    XtXinv = matInvert(XtX);
  }
  
  const beta = matMul(XtXinv, Xty);
  
  // Prediction function
  const predict = (X) => matMul(X, beta);
  
  return {
    beta,
    predict,
    usedAlpha,
    alphaAdjusted: usedAlpha !== alpha
  };
}

function linearRegression(X_train, y_train) {
  // Linear regression = Ridge with α=0
  // But use small alpha for numerical stability
  return ridgeRegression(X_train, y_train, 1e-8);
}
