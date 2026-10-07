/** Serve byte ranges from a fully cached movie, including when offline. */
export async function respondToMediaRange(request, response) {
  const range = request.headers.get("range");
  if (!range || response.status !== 200) return response;
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  const unsatisfiable = () =>
    new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
    });
  if (!match || (!match[1] && !match[2]) || !size) return unsatisfiable();
  let start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  let end = match[1] && match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    (!match[1] &&
      (!Number.isSafeInteger(Number(match[2])) || Number(match[2]) <= 0)) ||
    start >= size ||
    start > end
  )
    return unsatisfiable();
  end = Math.min(end, size - 1);
  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  headers.delete("Content-Encoding");
  return new Response(
    request.method === "HEAD" ? null : bytes.slice(start, end + 1),
    {
      status: 206,
      headers,
    },
  );
}
