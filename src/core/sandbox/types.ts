export type SandboxMessageType = 'REGISTER_HOOK' | 'EXECUTE_HOOK' | 'HOOK_RESULT' | 'LOG';

export interface SandboxMessage {
    type: SandboxMessageType;
    payload: any;
}

export interface RegisterHookPayload {
    hookType: 'ACTION' | 'FILTER';
    tag: string;
}

export interface ExecuteHookPayload {
    hookType: 'ACTION' | 'FILTER';
    tag: string;
    correlationId: string;
    args: any[];
}

export interface HookResultPayload {
    correlationId: string;
    result: any;
}
