# 🧠 Kolearning: Tu Tutor Personal Impulsado por IA

**Kolearning** es una plataforma de aprendizaje adaptativo de vanguardia diseñada para revolucionar la forma en que estudias y retienes el conocimiento. Utilizando un motor de IA basado en el algoritmo FSRS (Free Spaced Repetition System) y modelos de lenguaje avanzados, Kolearning personaliza tu experiencia de aprendizaje para maximizar la eficiencia y el dominio del material.

## ✨ Características Principales

- **🧠 Atomización de Contenido Inteligente**: Descompone automáticamente cualquier material de estudio (PDF, URLs, o texto plano) en "átomos" de conocimiento digeribles.
- **📈 Plan de Estudios Adaptativo**: Nuestro tutor estratégico de IA (Koli) analiza tu rendimiento, métricas de comportamiento (tiempo de respuesta, ayudas utilizadas) y el algoritmo FSRS para crear planes de estudio dinámicos y optimizados.
- **❓ Generación de Preguntas Diversas**: Crea automáticamente una variedad de tipos de preguntas para mantener las sesiones de estudio atractivas y efectivas:
  - Preguntas Abiertas
  - Opción Múltiple (con distractores generados por IA)
  - Preguntas de Ordenamiento
- **🕹️ Gamificación Motivacional**:
  - **Energía**: Limita las sesiones para promover el estudio espaciado y evitar el agotamiento.
  - **Créditos Cognitivos**: Gana recompensas por estudiar que puedes canjear en la tienda.
  - **Rangos de Aprendiz**: Progresa a través de diferentes niveles a medida que demuestras tu dominio.
- **☁️ Sincronización en la Nube con Supabase**: Accede a tus proyectos y progreso desde cualquier dispositivo, en cualquier momento.
- **📱 Diseño Responsivo**: Una experiencia de usuario fluida y consistente en dispositivos de escritorio y móviles.
- **🔒 Autenticación Segura**: Gestión de usuarios robusta y segura a través de Supabase Auth, incluyendo inicio de sesión con Google.

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) con [Shadcn/UI](https://ui.shadcn.com/) para componentes.
- **Backend y Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Inteligencia Artificial**: [Google Gemini](https://gemini.google.com/) a través del framework [Genkit](https://firebase.google.com/docs/genkit).
- **Algoritmo de Repetición Espaciada**: FSRS (Free Spaced Repetition System)

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para tener una instancia de Kolearning funcionando en tu máquina local.

### 1. Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn

### 2. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/kolearningMVP.git
cd kolearningMVP
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto copiando el ejemplo:

```bash
cp .env.example .env.local
```

Ahora, edita `.env.local` con tus propias claves:

```env
# Claves de tu proyecto en Supabase
NEXT_PUBLIC_SUPABASE_URL="https://<project_ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"

# Clave de API para Google Gemini
GEMINI_API_KEY="tu_gemini_api_key"
```

### 5. Configurar la Base de Datos

1.  Ve a tu proyecto en [Supabase](https://supabase.com).
2.  Navega al **SQL Editor**.
3.  Abre el archivo `database/schema.sql` de este repositorio, copia todo su contenido y pégalo en el editor de Supabase.
4.  Haz clic en **"RUN"** para ejecutar el script y crear todas las tablas y políticas de seguridad necesarias.

### 6. Ejecutar el Proyecto

```bash
npm run dev
```

¡Listo! Abre [http://localhost:3000](http://localhost:3000) en tu navegador y comienza a aprender.

## 🏗️ Arquitectura y Flujo de Datos

1.  **Registro**: El usuario crea una cuenta, aceptando los Términos y Condiciones. Sus preferencias (ej. newsletter) se guardan en los metadatos.
2.  **Creación de Proyecto**: El usuario proporciona material de estudio (URL, PDF, texto).
3.  **Procesamiento con IA (Genkit)**:
    - Un flujo de Genkit extrae el contenido.
    - Otro flujo "atomiza" el contenido en unidades de conocimiento.
    - Se generan preguntas y se almacena todo en Supabase.
4.  **Plan de Estudio**: El "Tutor Estratégico" de IA analiza el estado actual del proyecto y decide el tipo de sesión más adecuada (ej. "Introducción", "Refuerzo").
5.  **Sesión de Estudio**:
    - El usuario responde a las preguntas.
    - Se registran el rendimiento (correcto/incorrecto), el tiempo de respuesta y las ayudas utilizadas (`performanceLog`).
6.  **Adaptación**: Con cada respuesta, el sistema actualiza los parámetros FSRS del átomo y el `performanceLog` se envía al tutor de IA, quien puede recalibrar el plan de estudio en tiempo real.

## � Estructura del Proyecto

```
.
├── src/
│   ├── app/                # Rutas (App Router)
│   │   ├── (app)/          # Rutas protegidas (dashboard, proyectos, estudio)
│   │   ├── (auth)/         # Rutas de autenticación (login, signup)
│   │   └── api/            # Rutas de API
│   ├── ai/                 # Flujos de IA con Genkit (flows)
│   ├── components/         # Componentes de UI reutilizables (shadcn)
│   ├── contexts/           # Contextos de React (Auth, Project)
│   ├── lib/                # Librerías auxiliares y clientes (Supabase, utils)
│   └── middleware.ts       # Middleware de Next.js para sesiones de Supabase
├── database/
│   └── schema.sql          # Esquema SQL para la configuración inicial de la BD
└── ...
```

## 🚀 Despliegue

La forma más sencilla de desplegar Kolearning es usando **Vercel**.

1.  Haz un fork de este repositorio.
2.  Crea un nuevo proyecto en Vercel e impórtalo desde tu cuenta de GitHub.
3.  Configura las mismas variables de entorno que usaste en `.env.local` en la configuración del proyecto de Vercel.
4.  ¡Despliega! Vercel se encargará del resto.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si quieres mejorar Kolearning, por favor sigue estos pasos:

1.  Haz un Fork del proyecto.
2.  Crea una nueva rama (`git checkout -b feature/AmazingFeature`).
3.  Realiza tus cambios y haz commit (`git commit -m 'Add some AmazingFeature'`).
4.  Haz push a la rama (`git push origin feature/AmazingFeature`).
5.  Abre un Pull Request.

## � Licencia

Este proyecto está distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
