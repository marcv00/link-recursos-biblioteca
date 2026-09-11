# Recursos de Biblioteca — Universidad de Lima

Landing page para acceso directo (kiosko) a los recursos de información de la
Biblioteca. Lee el listado desde un Google Sheet y registra cada clic en una
hoja de historial (Título, Link, Fecha en formato `dd/mm/aaaa`).

Stack: **React + TypeScript + Vite + Tailwind CSS**, backend en
**Google Apps Script** (sin servidor propio que mantener).

---

## 1. Preparar el Google Sheet

1. Crea un Google Sheet nuevo (o usa el que ya tienes con tus datos).
2. Crea dos hojas (pestañas) exactamente con estos nombres:

   **Hoja "Recursos"** — encabezados en la fila 1:

   | Título | Tipo | Enlace | Imagen |
   |---|---|---|---|
   | ABC | Diario | https://www.abc.es | (opcional, URL de una imagen) |
   | ... | ... | ... | |

   > La columna `Imagen` es opcional. Si la dejas vacía, la tarjeta muestra
   > un ícono según el `Tipo` (Diario, Revista, Base de datos, Libro).

   Copia ahí tus 13 filas de datos (ABC, Costos, DIME, El Comercio, etc).

   **Hoja "Historial"** — encabezados en la fila 1:

   | Titulo | Link | Fecha |
   |---|---|---|
   | (se llena solo con cada clic) | | |


## 2. Desplegar el backend (Google Apps Script)

1. En tu Google Sheet: menú **Extensiones → Apps Script**.
2. Borra el contenido de `Code.gs` que aparece por defecto y pega el
   contenido del archivo `apps-script/Code.gs` de este proyecto.
3. Guarda el proyecto (ícono de disco, o `Ctrl+S`).
4. (Opcional pero recomendado) En el selector de funciones de la barra
   superior elige `inicializarHojas` y presiona **Ejecutar** una vez. Esto
   crea las hojas y encabezados si no existían. La primera vez te pedirá
   autorizar permisos (tu propia cuenta, es normal).
5. Despliega como Web App:
   - Botón **Implementar (Deploy) → Nueva implementación (New deployment)**.
   - Tipo: **Aplicación web (Web app)**.
   - "Ejecutar como" (Execute as): **Yo (tu cuenta)**.
   - "Quién tiene acceso" (Who has access): **Cualquier usuario (Anyone)**.
   - Presiona **Implementar** y autoriza los permisos solicitados.
   - Copia la **URL de la app web** que termina en `/exec`. Esa es tu
     `VITE_APPS_SCRIPT_URL`.

   > Importante: cada vez que edites `Code.gs` después de este primer
   > despliegue, debes ir a **Implementar → Gestionar implementaciones →
   > Editar (lápiz) → Nueva versión → Implementar** para que los cambios se
   > reflejen en la URL ya publicada.

## 3. Configurar el frontend

1. Instala dependencias (requiere Node.js 18+):

   ```bash
   npm install
   ```

2. Crea tu archivo de entorno local a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

3. Edita `.env` y pega la URL copiada en el paso anterior:

   ```
   VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycb.../exec"
   ```

4. Prueba en local:

   ```bash
   npm run dev
   ```

   Abre `http://localhost:5173` y verifica que las tarjetas cargan desde tu
   Sheet, y que al hacer clic se agrega una fila en "Historial".

## 4. Concurrencia (50+ clics simultáneos)

- **Lectura del listado**: se cachea 5 minutos tanto en el backend
  (`CacheService` de Apps Script) como en el navegador (`localStorage`), así
  que 200 máquinas no golpean el Sheet en cada carga de página.
- **Registro de clics**: el frontend abre el enlace *inmediatamente* (el
  usuario nunca espera) y envía el registro en paralelo con
  `navigator.sendBeacon`, diseñado para exactamente este caso (evento que
  no debe bloquear ni cancelarse al navegar). El backend usa
  `LockService` para serializar las escrituras en la hoja "Historial", de
  modo que aunque lleguen 50 clics en el mismo segundo, cada fila se agrega
  de forma correcta y sin corromper datos.
- Si por algún motivo el registro falla (sin internet momentáneo), el clic
  queda en una cola local (`localStorage`) y se reintenta automáticamente
  la próxima vez que la página cargue o vuelva la conexión.

## 5. Actualizar los recursos

Simplemente edita filas en la hoja "Recursos" del Google Sheet (agregar,
quitar, cambiar título/tipo/enlace/imagen). Los cambios aparecen en las
máquinas dentro de máximo 5 minutos (por la cache), o de inmediato si el
usuario refresca y ya pasó ese tiempo.

## Estructura del proyecto

```
biblioteca-landing/
├── apps-script/
│   └── Code.gs          # Backend: doGet (listar) + doPost (registrar clic)
├── src/
│   ├── api.ts            # Cliente HTTP + cache + cola de reintentos
│   ├── App.tsx            # Página principal, filtros y grid
│   ├── types.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── FilterBar.tsx
│   │   ├── ResourceCard.tsx
│   │   └── Footer.tsx
│   └── index.css
├── .env.example
└── package.json
```
