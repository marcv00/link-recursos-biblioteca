import type { Recurso, RecursosResponse } from './types';

// URL del Web App de Google Apps Script (ver README para el despliegue).
// Se define en un .env como VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/XXXX/exec"
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

const CACHE_KEY = 'biblioteca_recursos_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos: suficiente para 200 máquinas sin saturar el backend
const PENDING_LOGS_KEY = 'biblioteca_pending_logs_v1';

interface CacheShape {
  timestamp: number;
  resources: Recurso[];
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheShape;
  } catch {
    return null;
  }
}

function writeCache(resources: Recurso[]) {
  try {
    const payload: CacheShape = { timestamp: Date.now(), resources };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage lleno o deshabilitado: no es crítico, seguimos sin cache.
  }
}

/**
 * Obtiene el listado de recursos desde el Google Sheet (a través de Apps Script).
 * Usa una cache local de 5 minutos para que, con ~200 máquinas consultando a la vez,
 * el backend reciba solo una fracción de las peticiones. Si la red falla, se
 * devuelve la cache aunque esté vencida (mejor mostrar algo que una pantalla vacía).
 */
export async function fetchRecursos(options?: { force?: boolean }): Promise<Recurso[]> {
  const cached = readCache();
  const isFresh = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

  if (isFresh && !options?.force) {
    return cached!.resources;
  }

  if (!APPS_SCRIPT_URL) {
    if (cached) return cached.resources;
    throw new Error(
      'VITE_APPS_SCRIPT_URL no está configurada. Revisa el archivo .env (ver README).'
    );
  }

  try {
    const data = await fetchRecursosConReintentos_();
    writeCache(data);
    return data;
  } catch (err) {
    if (cached) return cached.resources; // degradar con gracia usando la cache anterior
    throw err;
  }
}

const MAX_INTENTOS = 3;
const TIMEOUT_MS = 8000; // no dejar que un intento colgado bloquee todo

/**
 * Los Web Apps de Apps Script a veces tardan mucho o devuelven una página
 * HTML de error transitoria (cold start, picos de carga de Google, etc).
 * Cada intento se corta a los 8s en vez de esperar indefinidamente, y
 * reintentamos con backoff corto antes de rendirnos.
 */
async function fetchRecursosConReintentos_(): Promise<Recurso[]> {
  let ultimoError: unknown;

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(APPS_SCRIPT_URL!, {
        method: 'GET',
        signal: controller.signal,
      });
      const raw = await res.text();

      let data: RecursosResponse;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `El servidor devolvió una respuesta no válida (intento ${intento}/${MAX_INTENTOS})`
        );
      }

      if (!data.ok || !data.resources) {
        throw new Error(data.error || 'Respuesta inválida del backend');
      }

      return data.resources;
    } catch (err) {
      ultimoError =
        err instanceof DOMException && err.name === 'AbortError'
          ? new Error(`Tiempo de espera agotado (intento ${intento}/${MAX_INTENTOS})`)
          : err;
      if (intento < MAX_INTENTOS) {
        await new Promise((r) => setTimeout(r, 300 * intento)); // backoff: 300/600/900ms
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw ultimoError;
}

interface PendingLog {
  titulo: string;
  enlace: string;
  ts: number;
}

function getPendingLogs(): PendingLog[] {
  try {
    const raw = localStorage.getItem(PENDING_LOGS_KEY);
    return raw ? (JSON.parse(raw) as PendingLog[]) : [];
  } catch {
    return [];
  }
}

function setPendingLogs(logs: PendingLog[]) {
  try {
    localStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // no-op
  }
}

function sendLog(titulo: string, enlace: string): boolean {
  if (!APPS_SCRIPT_URL) return false;

  // Usamos fetch en vez de navigator.sendBeacon porque sendBeacon SIEMPRE envía
  // las cookies de Google del navegador. Si la máquina tiene una sesión de Google
  // abierta, Google redirige al login antes de ejecutar doPost y el clic se pierde
  // sin ningún error visible. credentials: 'omit' evita eso.
  //
  // - mode: 'no-cors'  -> no necesitamos leer la respuesta, solo que llegue.
  // - text/plain       -> evita el preflight CORS; Apps Script lo recibe directo.
  // - keepalive: true  -> la petición sobrevive aunque se abra/navegue a otra pestaña.
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'omit',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ titulo, enlace }),
    keepalive: true,
  }).catch(() => {
    // Sin conexión u otro error de red: se guarda y se reintenta después.
    queuePendingLog(titulo, enlace);
  });

  return true;
}

function queuePendingLog(titulo: string, enlace: string) {
  const logs = getPendingLogs();
  logs.push({ titulo, enlace, ts: Date.now() });
  setPendingLogs(logs.slice(-200)); // límite defensivo
}

/** Reintenta enviar los registros de clics que no se pudieron guardar antes (offline, etc). */
export function flushPendingLogs() {
  const logs = getPendingLogs();
  if (logs.length === 0 || !APPS_SCRIPT_URL) return;
  setPendingLogs([]);
  logs.forEach((log) => {
    sendLog(log.titulo, log.enlace);
  });
}

/**
 * Registra el clic en el historial del Google Sheet. No bloquea ni retrasa la
 * apertura del recurso: se dispara en segundo plano justo después de abrir el link.
 */
export function logClick(titulo: string, enlace: string) {
  const ok = sendLog(titulo, enlace);
  if (!ok) queuePendingLog(titulo, enlace);
}