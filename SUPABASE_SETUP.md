# Configuración de Supabase para Kolearning

Esta guía te ayudará a configurar Supabase como base de datos y sistema de autenticación para Kolearning.

## Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que el proyecto se inicialice (puede tardar unos minutos)

## Paso 2: Configurar variables de entorno

1. En tu proyecto de Supabase, ve a `Settings` > `API`
2. Copia las siguientes credenciales:
   - `Project URL`
   - `anon public key`  
   - `service_role key` (mantén esta clave secreta)

3. Actualiza tu archivo `.env` con estos valores:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## Paso 3: Ejecutar el esquema de base de datos

1. En tu proyecto de Supabase, ve a `SQL Editor`
2. Copia todo el contenido del archivo `database/schema.sql`
3. Pégalo en el editor y ejecuta el script
4. Esto creará todas las tablas, índices, políticas de seguridad y funciones necesarias

## Paso 4: Configurar autenticación

### Autenticación por Email

La autenticación por email ya está configurada por defecto.

### Autenticación con Google (Opcional)

1. En tu proyecto de Supabase, ve a `Authentication` > `Settings` > `Auth Providers`
2. Habilita Google como proveedor
3. Configura las credenciales de Google OAuth:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Google+
   - Crea credenciales OAuth 2.0
   - Configura las URLs de redirección:
     - `https://tu-proyecto.supabase.co/auth/v1/callback`
     - `http://localhost:9002` (para desarrollo)

## Paso 5: Configurar políticas de seguridad (RLS)

Las políticas de Row Level Security ya están incluidas en el esquema SQL y proporcionan:

- **Perfiles**: Los usuarios solo pueden ver y editar su propio perfil
- **Proyectos**: Los usuarios solo pueden ver sus propios proyectos o proyectos públicos
- **Átomos, Fuentes, Sesiones**: Solo accesibles por el propietario del proyecto
- **Seguridad automática**: No es necesario validar manualmente los permisos en el frontend

## Paso 6: Verificar la configuración

1. Inicia tu aplicación: `npm run dev`
2. Ve a `/signup` y crea una nueva cuenta
3. Verifica que puedas iniciar sesión en `/login`
4. Verifica que se cree automáticamente un perfil en la tabla `profiles`

## Estructura de la base de datos

### Tablas principales:

- **profiles**: Extiende auth.users con información adicional del usuario
- **projects**: Proyectos de aprendizaje de cada usuario
- **atoms**: Átomos de conocimiento (preguntas/respuestas) con métricas FSRS
- **sources**: Fuentes/materiales subidos para cada proyecto
- **sessions**: Sesiones de estudio de cada proyecto
- **learning_path_items**: Elementos del plan de aprendizaje
- **session_atoms**: Relación muchos-a-muchos entre sesiones y átomos

### Funciones automáticas:

- **handle_new_user()**: Crea un perfil automáticamente cuando se registra un usuario
- **update_updated_at_column()**: Actualiza automáticamente las timestamps

### Índices optimizados:

- Consultas rápidas por usuario, proyecto y estado
- Búsqueda eficiente de proyectos públicos
- Filtrado rápido por fechas de repaso FSRS

## Migración de datos existentes

Si ya tienes datos en localStorage, puedes migrarlos ejecutando:

```typescript
// Código de migración estará disponible en ProjectContext
await migrateLocalStorageToSupabase()
```

## Troubleshooting

### Error: "Invalid JWT"
- Verifica que las variables de entorno estén correctas
- Asegúrate de haber reiniciado el servidor después de cambiar las variables

### Error: "Row Level Security"
- Verifica que las políticas RLS se hayan creado correctamente
- Ejecuta nuevamente el script SQL si es necesario

### Error de conexión
- Verifica que el proyecto de Supabase esté activo
- Comprueba que la URL del proyecto sea correcta

## Próximos pasos

Una vez configurado Supabase:

1. Los datos se guardarán automáticamente en la base de datos
2. Los usuarios podrán acceder a sus proyectos desde cualquier dispositivo
3. Los proyectos públicos estarán disponibles para toda la comunidad
4. Las métricas FSRS se mantendrán persistentemente

¡Tu aplicación Kolearning ya está lista para producción con Supabase!