# Guía del SDK de Conectores de Kolearning

Esta guía explica cómo desarrollar nuevos conectores para la plataforma Kolearning utilizando el SDK oficial.

## Arquitectura de Conectores

Kolearning utiliza una arquitectura modular basada en **Hooks (Acciones y Filtros)** y **Registros Especializados**. Un conector es una clase que extiende `BaseConector` y se registra en el sistema para extender su funcionalidad.

---

## Estructura Básica

Todo conector debe tener al menos esta estructura:

```typescript
import { BaseConector, ConectorMetadata } from '@kolearning/sdk';

export default class MiNuevoConector extends BaseConector {
    public metadata: ConectorMetadata = {
        id: 'mi-conector-unico',
        name: 'Mi Conector',
        description: 'Breve descripción de lo que hace.',
        icon: 'Activity', // Nombre de un icono de Lucide
        version: '1.0.0',
        author: 'Tu Nombre',
        category: 'Conectores de Canal' // O de Datos, Voz, etc.
    };

    register(): void {
        this.log("¡Conector iniciado!");
        // Aquí registras tus hooks o proveedores
    }

    unregister(): void {
        this.log("Limpiando recursos...");
        // Opcional: Limpieza de intervalos, suscripciones, etc.
    }
}
```

---

## Comunicación con el Sistema (Hooks)

El `HookRegistry` es la vía principal para interactuar con Kolearning.

### 1. Acciones (Events)
Se usan para **reaccionar** a eventos sin modificar datos.

```typescript
import { HookRegistry } from '@kolearning/sdk';

// Reaccionar cuando se completa una tarea
HookRegistry.addAction('on_task_executed', (data) => {
    console.log("La tarea se completó:", data.id);
});
```

### 2. Filtros (Interceptors)
Se usan para **modificar** datos antes de que el sistema los procese. **Siempre deben retornar un valor.**

```typescript
// Modificar el mensaje del sistema (System Prompt) antes de enviarlo a la IA
HookRegistry.addFilter('filter_system_prompt', (prompt) => {
    return `${prompt}\n\nREGLA ADICIONAL: Responde siempre en rima.`;
});
```

---

## Capacidades Avanzadas

### 1. Conectores de Datos (Búsqueda e Importación)
Implementa `IDataProvider` y regístrate en el `DataRegistry`.

```typescript
import { DataRegistry, IDataProvider, SearchResult } from '@kolearning/sdk';

export default class MyDataConector extends BaseConector implements IDataProvider {
    register() {
        DataRegistry.registerProvider(this.metadata.id, this);
    }
    // ... implementar search e import ...
}
```

### 2. Inyección de Interfaz (UI Slots)
Puedes inyectar botones o elementos en lugares específicos de la app.

```typescript
import { UISlotRegistry } from '@kolearning/sdk';

register() {
    UISlotRegistry.registerItem('chat_sidebar', {
        id: 'mi-boton-accion',
        conectorId: this.metadata.id,
        label: 'Mi Acción',
        icon: 'Zap',
        onClick: () => console.log("¡Acción ejecutada!")
    });
}
```

**Slots Disponibles:**
- `chat_sidebar`: Sobre la barra de escritura del chat.
- `project_header`: En la barra superior de un proyecto.

### 3. Ajustes Dinámicos (Settings Schema)
Define un esquema de ajustes para que la UI genere automáticamente un panel de configuración.

```typescript
public metadata: ConectorMetadata = {
    // ...
    settingsSchema: [
        { id: 'apiKey', label: 'Clave API', type: 'string', description: 'Tu clave secreta' },
        { id: 'enabled', label: 'Activo al inicio', type: 'boolean', defaultValue: true }
    ]
};
```

---

## Tipos de Conectores (Categorías)

1.  **Conectores de Datos**: Fuentes de contenido (Zotero, arXiv, PubMed).
2.  **Conectores de Canal**: Salidas de comunicación (WhatsApp, Telegram, Slack).
3.  **Conectores de Voz**: Transcripción y Síntesis (Whisper, ElevenLabs).
4.  **Conectores de Exportación**: Sincronización con otras apps (Google Tasks, Notion).
5.  **Módulos de Estudio**: Intervenciones pedagógicas o personalidades (Sócrates).

---

## Desarrollo y Despliegue

1.  **Repo Independiente**: Crea un nuevo proyecto `npm init`.
2.  **Dependencia**: Instala `@kolearning/sdk`.
3.  **Build**: Genera un bundle `.js`.
4.  **Carga Dinámica**: Usa `ConectorManager.loadAndRegisterConector('/ruta/a/tu/index.js')`.
