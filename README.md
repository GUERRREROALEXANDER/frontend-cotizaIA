# CotizaIA · Frontend

Centro de operaciones para agencias, construido con React, Vite, Tailwind CSS, Framer Motion y Lucide React. La interfaz se comunica con la API REST del backend Java con una sesión en cookies `HttpOnly` (el JWT nunca es legible desde JavaScript) y protección CSRF de doble envío; ver [docs/SECURITY-SESSION.md](docs/SECURITY-SESSION.md).

## Lenguaje visual

La interfaz usa una dirección editorial clara inspirada en la ficha “Apple iPhone Duo” de Refero Styles: tipografía de sistema, superficies blancas, controles redondeados y azul para las acciones principales. Los acentos cálidos conservan su función para importes y datos comerciales; la ilustración de la ciudad de agentes es original de CotizaIA.

El mapa isométrico admite un leve seguimiento del puntero en escritorio y anima sus rutas de agentes. El monitor del pipeline revela el avance entre handlers y cada nuevo registro de la transacción. Los efectos respetan la preferencia del sistema por movimiento reducido.

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

## Producción

```bash
npm run build
npm run preview
```

El directorio de distribución es `dist/`. En despliegues independientes, configura `VITE_API_URL` con la URL pública del backend y permite el origen del frontend en `app.cors.allowed-origins`.

## Integración y alcance de la API

- Inicio de sesión y registro: `/api/auth/login` y `/api/auth/register`.
- Resumen, briefs, clientes, ejecuciones, estrategia de precios y propuestas: `/api/analytics`, `/api/briefs`, `/api/clients`, `/api/executions`, `/api/agency/pricing-model` y `/api/proposals`.
- Los briefs se pueden crear (texto o PDF), listar, consultar y procesar; la bandeja los carga del servidor con `GET /api/briefs`, así que se ven igual desde cualquier equipo. El navegador solo guarda preferencias (tema, vista de propuestas, última notificación vista).
- Las vistas se descargan al abrirlas por primera vez (`React.lazy`), así que la pantalla de inicio de sesión no carga los gráficos ni el resto de la aplicación.
- Los recargos/descuentos de la vista de precios son una previsualización local. El modelo de precio y las horas de ítems de una propuesta sí se guardan a través de las operaciones disponibles en la API.
- La vista de progreso durante el procesamiento es ilustrativa. Los pasos mostrados como resultados y duraciones se cargan desde las ejecuciones devueltas por el backend.
