export type User = {
    id: string;
    name: string;
    email: string;
    password?: string; // Should not be stored long-term in a real app
    profession?: string;
    company?: string;
    age?: string;
    additionalInfo?: string;
};
