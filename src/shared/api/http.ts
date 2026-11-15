export class HttpError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(url: string, status: number, statusText: string) {
    super(`Cererea către ${url} a eșuat (${String(status)} ${statusText}).`);
    this.name = "HttpError";
    this.url = url;
    this.status = status;
  }
}

export type JsonGetter = (url: string) => Promise<unknown>;

async function defaultGetJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(url, response.status, response.statusText);
  }
  return (await response.json()) as unknown;
}

let jsonGetter: JsonGetter = defaultGetJson;

export function getJson(url: string): Promise<unknown> {
  return jsonGetter(url);
}

export function setJsonGetter(getter: JsonGetter): void {
  jsonGetter = getter;
}

export function resetJsonGetter(): void {
  jsonGetter = defaultGetJson;
}
