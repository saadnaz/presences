const encoded = "eyJmIjoiaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZm9ybXMvZC9lLzFGQUlwUUxTZmJ1SExIZnM4VHVUcnJqaHNzeDMwSU9hNTZMR0dvVjZIVVVtSkJoQXMtczc1ejB3L2Zvcm1SZXNwb25zZSIsImMiOiJkZmciLCJ0IjoiZGZnYSIsImQiOiIyMDI2LTAzLTE2IiwidG0iOiIxNjozOSIsInMiOiJTRVNTXzE3NzM2NzkxNzUzNzNfQkRIWUZXIiwiZSI6eyJjIjoiZW50cnkuNDI3MDA3MjUzIiwidCI6ImVudHJ5Ljg3Mzc2OTQzOSIsImQiOiJlbnRyeS4yOTY5MzQyNDEiLCJ0bSI6ImVudHJ5LjE0NTk3NTcyODAiLCJzIjoiZW50cnkuNDI3NDU0NTUyIiwibiI6ImVudHJ5LjE3MTYyNTI5NzEiLCJmbiI6ImVudHJ5LjIwMjE3NjEzMTgiLCJpZCI6ImVudHJ5LjM4NTA5NzE3NyJ9fQ";

function decodeSessionData(encoded) {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch (e) {
    console.error('decodeSessionData error:', e);
    return null;
  }
}

// Note: atob and btoa are not available in Node by default, but we can use Buffer
function atob(str) {
  return Buffer.from(str, 'base64').toString('binary');
}
function btoa(str) {
  return Buffer.from(str, 'binary').toString('base64');
}
// escape and unescape are deprecated but we can implement
function escape(str) {
  return str.replace(/[^A-Za-z0-9_\-.]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function unescape(str) {
  return str.replace(/%([0-9A-F]{2})/gi, function (match, hex) {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

const decoded = decodeSessionData(encoded);
console.log('Decoded:', JSON.stringify(decoded, null, 2));