import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock the contexts
const mockSendMessage = vi.fn();

vi.mock('@/contexts/AIContext', () => ({
    useAI: () => ({
        messages: [
            { id: '1', role: 'assistant', content: 'Hello! I am Kolearning.', timestamp: new Date(), status: 'sent' },
            { id: '2', role: 'user', content: 'Hi there!', timestamp: new Date(), status: 'sent' },
        ],
        sendMessage: mockSendMessage,
        isTyping: false,
        status: null,
        startNewChat: vi.fn(),
    }),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-123' },
        profile: { name: 'Test User' },
    }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

// Mock HookRegistry
vi.mock('@/core/domain/services/HookRegistry', () => ({
    HookRegistry: {
        applyFilters: vi.fn((name, val) => val),
        doAction: vi.fn(),
    },
}));

describe('ChatInterface', () => {
    beforeEach(() => {
        mockSendMessage.mockClear();
    });

    it('renders existing messages', () => {
        render(<ChatInterface />);
        expect(screen.getByText('Hello! I am Kolearning.')).toBeDefined();
        expect(screen.getByText('Hi there!')).toBeDefined();
    });

    it('updates input field when typing', () => {
        render(<ChatInterface />);
        const input = screen.getByPlaceholderText('chat.input_placeholder');
        fireEvent.change(input, { target: { value: 'New message' } });
        expect((input as HTMLInputElement).value).toBe('New message');
    });

    it('calls sendMessage when Send button is clicked', async () => {
        render(<ChatInterface />);
        const input = screen.getByPlaceholderText('chat.input_placeholder');
        const sendButton = screen.getByLabelText('Send message');

        fireEvent.change(input, { target: { value: 'New message' } });
        fireEvent.click(sendButton);

        expect(mockSendMessage).toHaveBeenCalledWith('New message', undefined);
    });
});
