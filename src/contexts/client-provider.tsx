
"use client";

import { ProjectProvider } from "./ProjectContext";

export function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <ProjectProvider>
            {children}
        </ProjectProvider>
    )
}
