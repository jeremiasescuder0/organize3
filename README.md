# Organize — Tu plataforma de estudio universitario

> Gestiona materias, tareas, exámenes, sesiones de estudio y notas desde un solo lugar.

---

## ✨ Funcionalidades

### 🏠 Dashboard personalizable
- Widgets arrastrables (Enfoque de hoy, Plan semanal, Próximos exámenes, Recomendaciones, Acciones rápidas)
- Layout de dos columnas con orden persistente por usuario

### ⏱️ Sesión de Enfoque (Pomodoro)
- Temporizador configurable con ciclos de foco, descanso corto y descanso largo
- Sonidos ambientales (lluvia, café, bosque, océano, chimenea, ruido blanco)
- Notificaciones de escritorio y seguimiento de sesiones por día

### 📓 Notas por materia
- Editor de texto enriquecido (negrita, cursiva, headings, listas, links)
- Filtrado por materia y búsqueda
- Almacenamiento local en el navegador

### 📅 Calendario académico
- Vista mensual de tareas y exámenes
- Creación y edición de eventos con prioridad y filtro por materia

### 📊 Estadísticas
- Tarjetas con métricas clave: exámenes próximos, tareas pendientes, horas de estudio semanales, materias activas

### 🎓 Gestión de materias
- Alta, edición y baja de materias con código de color por año
- Selector inicial con lista de materias predefinidas

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| Drag & Drop | @dnd-kit |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| Deploy | Vercel |

---

## 🚀 Setup local

### 1. Clonar el repositorio

```bash
git clone https://github.com/jeremiasescuder0/organize3.git
cd organize3
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Variables de entorno

Crear un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Base de datos

Ejecutar los scripts SQL en Supabase en este orden:

```
scripts/001_create_schema.sql
scripts/001_create_tables.sql
scripts/002_update_tables_no_auth.sql
```

### 5. Levantar el servidor

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del proyecto

```
organize3/
├── app/                  # Next.js App Router (páginas y rutas)
│   ├── page.tsx          # Dashboard principal
│   ├── subjects/         # Gestión de materias
│   └── auth/             # Login, registro, callback
├── components/           # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── draggable-dashboard.tsx
│   ├── focus-session.tsx
│   ├── academic-calendar.tsx
│   ├── subject-notes.tsx
│   └── ...
├── lib/
│   └── supabase/         # Clientes de Supabase (browser, server, middleware)
├── scripts/              # Scripts SQL de inicialización
├── middleware.ts          # Protección de rutas
└── public/               # Assets estáticos
```

---

## 🔐 Autenticación

Las rutas están protegidas por middleware usando Supabase SSR. Las únicas rutas públicas son:

- `/auth/login`
- `/auth/sign-up`
- `/auth/sign-up-success`
- `/auth/error`

---

## 📄 Términos y Condiciones

Ver [TERMS.md](./TERMS.md)

---

## 📝 Licencia

Este proyecto es de uso personal y académico. No se permite su distribución ni uso comercial sin autorización expresa del autor.
