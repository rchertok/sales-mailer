// src/lib/mime.ts
export function toBase64Url(str: string) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildMimeEmail({ from, to, subject, html }: { from:string; to:string; subject:string; html:string; }) {
  const boundary = "foo_bar_" + Math.random().toString(16).slice(2);
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n"); // crude strip

  const headers =
    `To: ${to}\r\n` +
    (from ? `From: ${from}\r\n` : "") +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

  const body =
    `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${text}\r\n\r\n` +
    `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${html}\r\n\r\n` +
    `--${boundary}--`;

  return headers + body;
}
