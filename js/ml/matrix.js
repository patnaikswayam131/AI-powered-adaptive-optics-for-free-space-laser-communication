// Matrix Mathematics Utilities
// Small matrix operations for Ridge/Linear regression
// Matrices are 2D arrays: number[][]

function matTranspose(A) {
  const rows = A.length;
  const cols = A[0].length;
  const result = [];
  for (let j = 0; j < cols; j++) {
    const row = [];
    for (let i = 0; i < rows; i++) {
      row.push(A[i][j]);
    }
    result.push(row);
  }
  return result;
}

function matMul(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = [];
  for (let i = 0; i < rowsA; i++) {
    const row = new Array(colsB).fill(0);
    for (let k = 0; k < colsA; k++) {
      for (let j = 0; j < colsB; j++) {
        row[j] += A[i][k] * B[k][j];
      }
    }
    result.push(row);
  }
  return result;
}

function matInvert(A) {
  // Gauss-Jordan elimination with partial pivoting
  const n = A.length;
  // Create augmented matrix [A | I]
  const aug = [];
  for (let i = 0; i < n; i++) {
    const row = [...A[i]];
    for (let j = 0; j < n; j++) {
      row.push(i === j ? 1 : 0);
    }
    aug.push(row);
  }
  
  for (let col = 0; col < n; col++) {
    // Partial pivoting: find largest element in column
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    
    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }
    
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error(`Matrix is singular or nearly singular at column ${col}`);
    }
    
    // Scale pivot row
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }
    
    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }
  
  // Extract inverse from augmented matrix
  const inv = [];
  for (let i = 0; i < n; i++) {
    inv.push(aug[i].slice(n));
  }
  return inv;
}

function matIdentity(n) {
  const I = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = 1;
    I.push(row);
  }
  return I;
}

function vecDot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function columnMeans(M) {
  const nRows = M.length;
  const nCols = M[0].length;
  const means = new Array(nCols).fill(0);
  for (let i = 0; i < nRows; i++) {
    for (let j = 0; j < nCols; j++) {
      means[j] += M[i][j];
    }
  }
  return means.map(s => s / nRows);
}

// Convert 1D array to column vector (2D array with 1 column)
function toColumnVec(arr) {
  return arr.map(v => [v]);
}

// Convert 1D arrays to proper 2D matrix format
function toMatrix(arr2d) {
  // Ensure each row is a proper array
  return arr2d.map(row => Array.isArray(row) ? [...row] : [row]);
}
