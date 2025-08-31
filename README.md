# 🧠 Kolearning - Plataforma de Aprendizaje Adaptativo

Una plataforma de aprendizaje inteligente que utiliza algoritmos FSRS (Free Spaced Repetition System) para optimizar la retención del conocimiento.

## ✨ Características

- **🔬 Atomización Inteligente**: Descompone automáticamente el contenido en conceptos clave
- **🧪 Algoritmo FSRS**: Sistema de repetición espaciada científicamente probado
- **🤖 IA Adaptativa**: Ajusta el plan de estudios basándose en tu rendimiento
- **📱 Sincronización en la Nube**: Accede a tus proyectos desde cualquier dispositivo
- **🔒 Autenticación Segura**: Sistema de usuarios con Supabase
- **📊 Métricas Avanzadas**: Seguimiento detallado del progreso y dominio

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd kolearningMVP
npm install
```

### 2. Configurar Supabase

#### Opción A: Script automático (Recomendado)
```bash
node scripts/setup-supabase.js
```

#### Opción B: Configuración manual
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia `.env.example` a `.env` y completa las variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```
3. Ejecuta el esquema SQL en Supabase:
   - Ve al SQL Editor en tu proyecto
   - Copia y ejecuta el contenido de `database/schema.sql`

### 3. Configurar IA (Gemini)
```env
GEMINI_API_KEY=tu-gemini-api-key
```

### 4. Iniciar el servidor
```bash
npm run dev
```

¡Accede a `http://localhost:9002` y comienza a aprender!

## 📖 Guía de Uso

### Primeros Pasos
1. **Crear cuenta**: Ve a `/signup` y regístrate
2. **Subir material**: Sube PDFs, documentos o texto en `/new-project`
3. **Estudiar**: Koli creará automáticamente un plan personalizado
4. **Seguir progreso**: Revisa tu dominio y métricas en cada proyecto

### Migración de Datos Locales
Si usaste Kolearning antes de la integración con Supabase:
1. Inicia sesión en tu cuenta
2. Ve a `/migrate`
3. La plataforma detectará automáticamente tus datos locales
4. Haz clic en "Migrar datos" para sincronizarlos en la nube

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Google Gemini API con Genkit
- **Algoritmos**: FSRS para repetición espaciada

### Base de Datos
```sql
profiles          -- Usuarios y estadísticas
projects          -- Proyectos de aprendizaje
atoms             -- Átomos de conocimiento con métricas FSRS
sources           -- Materiales fuente (PDFs, documentos)
sessions          -- Sesiones de estudio
learning_path_items -- Planes de aprendizaje
```

### Flujo de Datos
1. **Upload** → Procesamiento IA → Atomización
2. **Estudio** → Métricas FSRS → Ajuste adaptativo
3. **Sincronización** → Supabase → Multi-dispositivo

## 🔧 Desarrollo

### Comandos Útiles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run typecheck    # Verificar tipos TypeScript
npm run lint         # Linter
```

### Estructura del Proyecto
```
src/
├── app/                 # Rutas y páginas
├── components/          # Componentes UI reutilizables
├── contexts/            # Contextos React (Auth, Projects)
├── lib/                 # Utilidades y configuración
│   ├── supabase/       # Configuración Supabase
│   └── database.types.ts # Tipos TypeScript para DB
├── ai/                  # Flujos de IA con Genkit
└── middleware.ts        # Middleware de autenticación

database/
└── schema.sql          # Esquema completo de la base de datos

scripts/
└── setup-supabase.js   # Script de configuración automática
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Fork del repositorio
2. Conecta con Vercel
3. Configura las variables de entorno
4. Deploy automático

### Variables de Entorno para Producción
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## 🔒 Seguridad y Privacidad

- **Row Level Security (RLS)**: Los usuarios solo acceden a sus datos
- **Encriptación**: Todas las comunicaciones están encriptadas
- **Validación**: Input sanitization y validación tanto client como server-side
- **Auth**: Autenticación robusta con Supabase Auth

## 🤝 Contribuir

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📚 Algoritmo FSRS

Kolearning utiliza el algoritmo FSRS (Free Spaced Repetition System) para optimizar el aprendizaje:

- **Difficulty**: Qué tan difícil es el concepto (0-1)
- **Stability**: Cuánto tiempo recordarás (en días)
- **Retrievability**: Facilidad de recordar actual (0-1)

El sistema ajusta automáticamente los intervalos de repaso basándose en tu rendimiento.

## 🎯 Roadmap

- [ ] **Colaboración**: Proyectos compartidos entre usuarios
- [ ] **Gamificación**: Sistema de logros y rankings
- [ ] **Análisis Avanzado**: Dashboards de progreso detallados
- [ ] **Integración LMS**: Conectores para Moodle, Canvas, etc.
- [ ] **Móvil**: App nativa React Native
- [ ] **Offline**: Modo offline con sincronización

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Issues**: GitHub Issues para reportar problemas
- **Discusiones**: GitHub Discussions para preguntas

---

**Hecho con ❤️ para revolucionar el aprendizaje personalizado**
