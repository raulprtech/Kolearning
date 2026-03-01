import { describe, it, expect } from 'vitest';
import { cn, extractYouTubeId } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names', () => {
            expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
        });

        it('should handle conditional class names', () => {
            expect(cn('btn', true && 'btn-active', false && 'btn-hidden')).toBe('btn btn-active');
        });

        it('should handle tailwind conflicts', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2');
        });
    });

    describe('extractYouTubeId', () => {
        it('should extract ID from standard URL', () => {
            expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        });

        it('should extract ID from short URL', () => {
            expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        });

        it('should extract ID from embed URL', () => {
            expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        });

        it('should return null for invalid URL', () => {
            expect(extractYouTubeId('https://example.com')).toBe(null);
        });
    });
});
