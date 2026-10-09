# CotizaIA · Frontend

Centro de operaciones para agencias, construido con React, Vite, Tailwind CSS, Framer Motion y Lucide React. La interfaz se comunica con la API REST del backend Java mediante JWT.

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

Para usar otro servidor, define `VITE_API_URL` antes de iniciar o compilar:

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
- Los briefs se pueden crear, consultar por identificador y procesar. El backend no ofrece un endpoint para listar todo el historial de briefs; por eso, la bandeja conserva localmente los briefs creados en este navegador y consulta su detalle en el servidor.
- Los recargos/descuentos de la vista de precios son una previsualización local. El modelo de precio y las horas de ítems de una propuesta sí se guardan a través de las operaciones disponibles en la API.
- La vista de progreso durante el procesamiento es ilustrativa. Los pasos mostrados como resultados y duraciones se cargan desde las ejecuciones devueltas por el backend.
