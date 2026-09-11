/**
 * BIBLIOTECA UNIVERSIDAD DE LIMA — Backend de recursos (Google Apps Script)
 * -------------------------------------------------------------------------
 * Este script se ata al Google Sheet que contiene dos hojas:
 *
 *   1) "Recursos"  -> columnas: Título | Tipo | Enlace | Imagen (opcional)
 *   2) "Historial" -> columnas: Titulo | Link | Fecha
 *
 * doGet()  -> devuelve el listado de recursos en JSON (con cache de 5 min).
 * doPost() -> agrega una fila al historial cada vez que se hace clic en un
 *             recurso desde el frontend. Usa LockService para que, aunque
 *             lleguen 50+ clics al mismo tiempo desde distintas máquinas,
 *             las filas se escriban una por una sin pisarse ni corromperse.
 */

const RESOURCES_SHEET_NAME = 'Recursos';
const HISTORY_SHEET_NAME = 'Historial';
const CACHE_KEY = 'recursos_cache_v1';
const CACHE_SECONDS = 300; // 5 minutos

function getSpreadsheet_() {
  // Al estar el script ATADO al Sheet (Extensiones > Apps Script), esto
  // siempre apunta al spreadsheet correcto sin necesitar un ID hardcodeado.
  return SpreadsheetApp.getActiveSpreadsheet();
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return jsonOutput_(JSON.parse(cached));
    }

    const sheet = getSpreadsheet_().getSheetByName(RESOURCES_SHEET_NAME);
    if (!sheet) {
      return jsonOutput_({ ok: false, error: 'No se encontró la hoja "Recursos"' });
    }

    const values = sheet.getDataRange().getValues();
    const headers = values.shift().map((h) => String(h).trim());

    const idxTitulo = headers.indexOf('Título') !== -1 ? headers.indexOf('Título') : headers.indexOf('Titulo');
    const idxTipo = headers.indexOf('Tipo');
    const idxEnlace = headers.indexOf('Enlace');
    const idxImagen = headers.indexOf('Imagen');

    const resources = values
      .filter((row) => row[idxTitulo] && row[idxEnlace])
      .map((row) => ({
        titulo: String(row[idxTitulo]).trim(),
        tipo: idxTipo !== -1 ? String(row[idxTipo]).trim() : '',
        enlace: String(row[idxEnlace]).trim(),
        imagen: idxImagen !== -1 ? String(row[idxImagen] || '').trim() : '',
      }));

    const payload = { ok: true, resources: resources };
    cache.put(CACHE_KEY, JSON.stringify(payload), CACHE_SECONDS);
    return jsonOutput_(payload);
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Espera hasta 15s por el lock. Con appendRow (~150-300ms por escritura)
    // esto soporta ráfagas de decenas de clics simultáneos sin perder datos.
    lock.waitLock(15000);

    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonOutput_({ ok: false, error: 'JSON inválido' });
    }

    const titulo = String(body.titulo || '').trim();
    const enlace = String(body.enlace || '').trim();
    if (!titulo || !enlace) {
      return jsonOutput_({ ok: false, error: 'Faltan campos: titulo/enlace' });
    }

    const sheet = getSpreadsheet_().getSheetByName(HISTORY_SHEET_NAME);
    if (!sheet) {
      return jsonOutput_({ ok: false, error: 'No se encontró la hoja "Historial"' });
    }

    const tz = getSpreadsheet_().getSpreadsheetTimeZone();
    const fecha = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');

    sheet.appendRow([titulo, enlace, fecha]);

    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ejecutar UNA VEZ manualmente desde el editor de Apps Script para crear
 * las hojas y encabezados si el Sheet está vacío. Ver README para más detalle.
 */
function inicializarHojas() {
  const ss = getSpreadsheet_();

  let recursos = ss.getSheetByName(RESOURCES_SHEET_NAME);
  if (!recursos) {
    recursos = ss.insertSheet(RESOURCES_SHEET_NAME);
  }
  if (recursos.getLastRow() === 0) {
    recursos.appendRow(['Título', 'Tipo', 'Enlace', 'Imagen']);
  }

  let historial = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (!historial) {
    historial = ss.insertSheet(HISTORY_SHEET_NAME);
  }
  if (historial.getLastRow() === 0) {
    historial.appendRow(['Titulo', 'Link', 'Fecha']);
  }
}
