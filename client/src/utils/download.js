/** Save a Blob as a file in the browser. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** rows: array of arrays -> CSV download (UTF-8 with BOM so Excel shows ₹). */
export function downloadCSV(rows, filename) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), filename);
}

/** Read the filename from a Content-Disposition header. */
export function filenameFromResponse(response, fallback) {
  const header = response.headers.get("Content-Disposition") || "";
  const match = header.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : fallback;
}
