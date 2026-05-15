# Documento de Requisitos de Software (PRD) - Planificador de Viajes con IA (Estilo Roamy/Video)

## 1. Introducción
Este documento detalla los requerimientos para el desarrollo de una aplicación web de planificación de viajes inteligente, diseñada para transformar lugares de interés en itinerarios optimizados y realistas, basada en el flujo visual y funcional observado en la referencia de video.

## 2. Alcance del Proyecto
La aplicación permitirá a los usuarios centralizar sus descubrimientos de viajes, planificar itinerarios detallados mediante inteligencia artificial y colaborar con otros viajeros. El enfoque es un producto que combina un mapa interactivo, un planificador de itinerarios y un organizador visual de viajes.

## 3. Historias de Usuario
*   **Usuario Viajero:**
    *   Como usuario quiero crear un viaje indicando ciudad y duración para recibir un plan automático.
    *   Como usuario quiero elegir intereses para que las recomendaciones sean personalizadas.
    *   Como usuario quiero ver mi itinerario en un mapa para entender la ruta.
    *   Como usuario quiero abrir el detalle de cada lugar para decidir si lo mantengo.
    *   Como usuario quiero guardar lugares en listas para reutilizarlos después.
    *   Como usuario quiero editar mi itinerario si no me gusta el orden sugerido.

## 4. Requisitos Funcionales

### A. Gestión de Usuarios
*   Registro e inicio de sesión con correo.
*   Login social con Google.
*   Perfil de usuario con preferencias: idioma, moneda, país y estilo de viaje.
*   Guardado de viajes y listas de lugares favoritos.

### B. Pantalla Principal con Mapa
*   Vista principal tipo mapa interactivo (Mapbox/Google Maps).
*   Visualización de spots guardados y lugares cercanos.
*   Filtrado por categorías.
*   Interacción: Zoom, clic en marcadores, fichas resumidas, cálculo de rutas visuales.

### C. Creación de Viaje (Wizard/Modal)
*   Campos: Destino, fechas o número de días.
*   Preferencias: Popular, naturaleza, historia, museos, comida, compras.
*   Extras: Presupuesto, tipo de viaje (solo, pareja, amigos, familia), ritmo (relajado, medio, intenso).

### D. Generación Automática de Itinerario
*   Motor de IA para generar planes día a día.
*   Retorno: Nombre del viaje, duración, lista de lugares por día con orden sugerido, tiempos de traslado y rutas.
*   Detalle por actividad: Hora sugerida, duración estimada, traslado, puntos de inicio y fin.

### E. Vista de Itinerario (Dashboard)
*   Pestañas: Overview, Itinerary, Day 1, Day 2, etc.
*   Tarjetas de lugares con fotos y descripción.
*   Edición manual: Arrastrar y soltar, mover entre días, bloquear lugares, eliminar o agregar manualmente.

### F. Ficha de Lugar
*   Información: Nombre, imagen, calificación, descripción, horarios, ubicación, categoría.
*   Acciones: Botón guardar, botón "cómo llegar".

### G. Listas y Lugares Guardados
*   Creación de listas personalizadas (ej. "Museos favoritos", "Viaje gastronómico").
*   Añadir lugares a viajes directamente desde listas.

### H. Buscador y Recomendaciones
*   Buscador global con autocompletado para ciudades, países y atracciones.
*   Motor de sugerencias basado en ubicación, categoría, días y preferencias del usuario.

## 5. Requisitos No Funcionales
*   **Rendimiento:** Mapa de carga rápida e itinerario generado en pocos segundos.
*   **Responsividad:** Mobile-first, pero funcional en desktop y tablet.
*   **Seguridad:** Autenticación robusta y cifrado de datos.
*   **Usabilidad:** Experiencia visual, limpia, con mapa siempre protagonista y cards redondeadas.

## 6. Arquitectura y Stack Tecnológico
### Frontend
*   Next.js 15+ (React).
*   Tailwind CSS + shadcn/ui.
*   Mapbox GL JS o Google Maps API.
*   Drag and drop (dnd-kit o react-beautiful-dnd).

### Backend
*   Node.js con NestJS o Express.
*   PostgreSQL + PostGIS para datos geográficos.
*   Redis para caché.

### IA y Servicios Externos
*   OpenAI API (GPT-4o) para generación de itinerarios y descripciones.
*   Google Places API / Mapbox Search para geolocalización y detalles de lugares.

## 7. Modelo de Datos Mínimo
*   `Users`: Perfil, credenciales, preferencias.
*   `Trips`: Meta-información, destino, fechas, presupuesto.
*   `TripDays`: Organización de días dentro de un viaje.
*   `Places`: Catálogo de lugares con coordenadas y categorías.
*   `DayPlaces`: Relación entre un día específico y un lugar asignado.
*   `SavedLists`: Listas personalizadas del usuario.
*   `SavedListPlaces`: Lugares dentro de las listas.

## 8. Backlog MVP
1.  **Fase 1 (V1):** Registro/Login, mapa principal, creación de viaje (destino/días/preferencias), itinerario simple con IA, visualización de ruta y detalle de lugares.
2.  **Fase 2:** Listas personalizadas, compartir viaje, edición drag & drop, colaboración.
3.  **Fase 3:** Presupuesto, clima, restaurantes/hoteles integrados, sincronización con calendario.
