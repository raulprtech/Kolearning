# Skill System Architecture (Hooks & Filters)

Kolearning uses an extensible Skill System inspired by WordPress and OpenClaw. This allow developers to add new features or modify existing behavior without touching the core codebase.

## Core Concepts

### 1. HookRegistry (Actions & Filters)
The centralized system for event communication and data modification.
- **Actions**: Triggered when an event occurs. Handlers perform side effects (e.g., sending a notification).
- **Filters**: Triggered to modify a value. Handlers must return the modified value.

### 2. ISkill Interface
All extensions must implement the `ISkill` interface:
```typescript
interface ISkill {
  metadata: { id: string; name: string; ... };
  register(): void; // Use this to register hooks in HookRegistry
}
```

## Available Hooks

| Hook | Type | Description |
| :--- | :--- | :--- |
| `on_message_sent` | Action | Triggered when a message is sent in the chat. |
| `filter_user_message` | Filter | Allows modifying the user message before processing. |
| `on_atoms_generated` | Action | Triggered after the AI generates learning atoms. |
| `filter_atoms_after_generation` | Filter | Allows modifying the list of generated atoms. |
| `filter_assistant_config` | Filter | Modifies the assistant name, avatar, or personality in the UI. |
| `filter_system_prompt` | Filter | Modifies the AI system prompt (deep behavior/personality). |

## Creating a New Skill
1. Create a class in `src/infrastructure/skills/`.
2. Implement the `ISkill` interface.
3. Use `HookRegistry.addAction` or `HookRegistry.addFilter` in the `register()` method.
4. Add the skill initialization logic in `src/infrastructure/skills/index.ts`.

Example:
```typescript
export class MyFeatureSkill implements ISkill {
  metadata = { id: 'my_feature', name: 'My Feature' };
  register() {
    HookRegistry.addAction('on_message_sent', (msg) => console.log(msg));
  }
}
```
