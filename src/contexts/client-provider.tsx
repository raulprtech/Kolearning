"use client";

// Switch to the Supabase-enabled context
import { ProjectProvider } from "./ProjectContext";
import { AuthProvider } from "./AuthContext";

export function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ProjectProvider>
                {children}
            </ProjectProvider>
        </AuthProvider>
    )
}
