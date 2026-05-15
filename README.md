# Roamy Clone - Planificador de Viajes con IA

Este proyecto es una aplicación web de planificación de viajes que utiliza Inteligencia Artificial para optimizar itinerarios basados en lugares guardados y preferencias del usuario.

## Estructura del Proyecto

- `/frontend`: Aplicación Next.js 15+ con Tailwind CSS.
- `/backend`: API en Node.js con Express y TypeScript.
- `PRD.md`: Documento de Requisitos de Software detallado.

## Requisitos Previos

- Node.js 18+
- npm o yarn

## Cómo empezar

### 1. Clonar el repositorio e instalar dependencias

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Ejecutar en desarrollo

**Frontend:**
```bash
cd frontend
npm run dev
# Abierto en http://localhost:3000
```

**Backend:**
```bash
cd backend
npm run dev
# Abierto en http://localhost:3001
```

## Próximos Pasos (MVP)

1. **Autenticación:** Configurar NextAuth.js para login con Google/Apple.
2. **Base de Datos:** Configurar PostgreSQL con Prisma o TypeORM.
3. **Mapas:** Integrar Mapbox para la visualización de spots.
4. **Motor de IA:** Implementar servicios de OpenAI para la generación de itinerarios.
