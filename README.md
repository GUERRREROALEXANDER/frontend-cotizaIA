# CotizaIA · Frontend

Centro de operaciones para agencias, construido con React, Vite, Tailwind CSS, Framer Motion y Lucide React. La interfaz se comunica con la API REST del backend Java con una sesión en cookies `HttpOnly` (el JWT nunca es legible desde JavaScript) y protección CSRF de doble envío; ver [docs/SECURITY-SESSION.md](docs/SECURITY-SESSION.md).

## Lenguaje visual

La paleta sale de `src/theme/tokens.css`: verde bosque (`#163300`) para la marca y lima (`#9fe870`) para las acciones principales sobre un fondo claro (`#f4f6f1`), con tema oscuro (`html[data-theme="dark"]`) que invierte esos papeles. Los estados de las propuestas tienen colores sólidos propios. Ningún componente usa colores sueltos: todos leen los tokens.

La pantalla del agente muestra una escena 3D original (Three.js, `src/components/agent3d/`) con un robot y los siete pasos del pipeline; Three.js se descarga solo al abrir esa pantalla, y mientras llega se muestra una versión sin 3D. El monitor del pipeline revela el avance entre handlers. Los efectos respetan la preferencia del sistema por movimiento reducido.

## Requisitos

- Node.js 20 o superior
- Backend CotizaIA disponible en `http://localhost:8080`

## Desarrollo local

```bash
npm install
npm run dev
```

Vite publica la aplicación en `http://localhost:5173` y redirige `/api` y `/actuator` al backend en el puerto `8080`.

Si el backend corre en otro puerto (por ejemplo, porque el 8080 está ocupado), indica la dirección al proxy con `BACKEND_URL`:

```powershell
$env:BACKEND_URL = "http://localhost:8081"
npm run dev
```

### Datos de demostración

Con el backend en marcha, `python scripts/seed_demo.py` en el repositorio del backend carga la agencia ficticia *Estudio Nariño Digital*: clientes, catálogo, tarifas, memoria de propuestas pasadas y propuestas en todos los estados. Entra con `demo@estudio-narino.test` / `CotizaIA-demo-2026`.

### Otro servidor sin proxy

Para hablar directamente con un backend publicado, define `VITE_API_URL` antes de iniciar o compilar:

```powershell
$env:VITE_API_URL = "https://api.ejemplo.com"
npm run dev
```

## Pruebas

```bash
npm run test:unit   # node --test, sin navegador: helpers puros y cliente de la API (src/api.js)
npm run test:e2e    # Playwright contra el servidor de Vite (lo arranca solo)
```

- Las pruebas unitarias viven en `tests/unit/` y no necesitan el backend.
- `tests/e2e/live-refresh.spec.js` y `tests/e2e/whatsapp.spec.js` simulan la API dentro del navegador.
- `tests/e2e/session-security.spec.js` necesita el backend en el puerto 8080, y `tests/e2e/demo-tour.spec.js` además la agencia demo cargada con `scripts/seed_demo.py`; si falta, la prueba se salta.
- El backend limita los intentos de inicio de sesión: si una prueba recibe 429, espera unos minutos o reinicia el backend.

## Producción

```bash
npm run build
npm run preview
```

El directorio de distribución es `dist/`. En despliegues independientes, configura `VITE_API_URL` con la URL pública del backend y permite el origen del frontend en `app.cors.allowed-origins`.

### Vercel (despliegue actual)

El frontend publicado vive en Vercel y el backend en Render. `vercel.json` reenvía `/api/*` y `/actuator/health` al backend, así la app y la API comparten origen y las cookies `SameSite=Strict` funcionan sin CORS. Por eso, en Vercel, `VITE_API_URL` debe quedar **vacía**. El mismo archivo envía la política CSP estricta, HSTS y las demás cabeceras de seguridad.

## Pantallas

Definidas en `src/navigation.js`; la ruta vive en el hash (`#/propuestas`) y las teclas 1 a 9 saltan a cada una.

| Tecla | Pantalla | Para qué sirve |
| --- | --- | --- |
| 1 | Resumen | Indicadores, propuestas que piden atención y últimos briefs |
| 2 | Bandeja | Crear briefs (WhatsApp, correo, formulario o PDF) y procesarlos |
| 3 | Agente | Ver los pasos del agente de cada ejecución |
| 4 | Propuestas | Revisar ítems, ajustar horas, extras, deshacer y cambiar de estado |
| 5 | Precios | Estrategia de precio de la agencia (fija, por hora o por fases) |
| 6 | Clientes | Alta y edición de clientes |
| 7 | Catálogo | Servicios y tipos de requisito con sus horas base |
| 8 | Tarifas | Roles y su tarifa por hora en COP |
| 9 | Conocimiento | PDF de propuestas pasadas que alimentan la memoria del agente |
| — | WhatsApp | Vincular el número del dueño y recibir avisos de propuestas |

## Integración y alcance de la API

- Inicio de sesión y registro: `/api/auth/login` y `/api/auth/register`.
- Resumen, briefs, clientes, ejecuciones, estrategia de precios y propuestas: `/api/analytics`, `/api/briefs`, `/api/clients`, `/api/executions`, `/api/agency/pricing-model` y `/api/proposals`.
- Los briefs se pueden crear (texto o PDF), listar, consultar y procesar; la bandeja los carga del servidor con `GET /api/briefs`, así que se ven igual desde cualquier equipo. El navegador solo guarda preferencias (tema, vista de propuestas, última notificación vista).
- Las vistas se descargan al abrirlas por primera vez (`React.lazy`), así que la pantalla de inicio de sesión no carga los gráficos ni el resto de la aplicación.
- La urgencia, el descuento y la garantía extendida son registros reales de la propuesta (`/api/proposals/{id}/extras`), igual que el modelo de precio y las horas de cada ítem; los ajustes de horas y extras se pueden deshacer.
- El avance durante el procesamiento es real: la bandeja consulta `GET /api/briefs/{id}/progress` cada segundo mientras el agente trabaja, y los resultados y duraciones de cada paso se cargan desde las ejecuciones del backend.
