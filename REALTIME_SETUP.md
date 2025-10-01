# 🔴 Configuración de Supabase Realtime para Sincronización en Tiempo Real

## 📋 ¿Qué hace esto?

Permite que los cambios en proyectos se **sincronicen instantáneamente** entre diferentes navegadores, tabs y dispositivos sin necesidad de recargar la página.

## ⚙️ Pasos para Habilitar Realtime

### 1. **Ir al Dashboard de Supabase**
   - Abre https://supabase.com/dashboard
   - Selecciona tu proyecto de Kolearning

### 2. **Habilitar Realtime en la tabla `projects`**

#### Opción A: Desde la UI (Más fácil)
1. Ve a **Database** > **Tables**
2. Encuentra la tabla `projects`
3. Click en los 3 puntos (⋮) > **Edit table**
4. Scroll hasta abajo y encuentra **Realtime**
5. ✅ **Activa** el switch de "Enable Realtime"
6. Click en **Save**

#### Opción B: Desde SQL Editor (Más rápido)
1. Ve a **SQL Editor**
2. Crea una nueva query
3. Pega este código:

```sql
-- Habilitar Realtime en la tabla projects
ALTER TABLE public.projects
REPLICA IDENTITY FULL;

-- Verificar que esté habilitado
SELECT schemaname, tablename, replica_identity
FROM pg_tables
WHERE tablename = 'projects';
```

4. Click en **Run**
5. Deberías ver `replica_identity = 'f'` (que significa FULL)

### 3. **Verificar que funciona**

Después de habilitar Realtime:

1. Abre dos navegadores diferentes (o dos ventanas de incognito)
2. Inicia sesión con la misma cuenta en ambos
3. En el navegador 1: Crea un nuevo proyecto
4. En el navegador 2: **Deberías ver el proyecto aparecer automáticamente** sin recargar

Verás en la consola:
```
[Realtime] Setting up Supabase Realtime subscriptions
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Projects table change detected: {...}
[Sync] Reloading data from Supabase
```

## 🔍 Troubleshooting

### "Subscription status: CHANNEL_ERROR"
- Verifica que Realtime esté habilitado en la tabla `projects`
- Asegúrate de que tu plan de Supabase soporte Realtime (Free tier sí lo soporta)

### "No veo cambios en tiempo real"
1. Verifica los logs de la consola del navegador
2. Asegúrate de que ambas sesiones estén autenticadas
3. Verifica que el `user_id` del filtro sea correcto

### "Demasiados recargas"
- Es normal que `loadUserData()` se llame al detectar cambios
- Considera implementar debouncing si es necesario

## 📊 Tablas que se Sincronizan

Actualmente solo la tabla `projects` está configurada para Realtime.

Si quieres sincronizar **atoms**, **sessions**, etc., repite el proceso para esas tablas:

```sql
-- Para atoms
ALTER TABLE public.atoms REPLICA IDENTITY FULL;

-- Para sessions
ALTER TABLE public.sessions REPLICA IDENTITY FULL;

-- Para learning_path_items
ALTER TABLE public.learning_path_items REPLICA IDENTITY FULL;
```

## 💡 Alternativas (si no quieres usar Realtime)

Si prefieres no usar Realtime, la app ya tiene sincronización **por focus**:
- Cuando cambias de tab/ventana, se recarga automáticamente
- Funciona pero no es instantáneo

## 📝 Notas Importantes

- ✅ Realtime está incluido en el **Free tier** de Supabase
- ✅ Solo sincroniza datos del usuario actual (por el filtro `user_id`)
- ✅ No afecta el rendimiento negativamente
- ⚠️ Asegúrate de tener Row Level Security (RLS) habilitado

## 🎯 Resultado Esperado

Con Realtime habilitado:
- ✅ Cambios instantáneos entre navegadores
- ✅ Sin necesidad de recargar manualmente
- ✅ Mejor experiencia de usuario
- ✅ Sincronización en menos de 1 segundo
