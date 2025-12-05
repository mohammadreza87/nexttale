import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../authContext';

let unsubscribeMock: ReturnType<typeof vi.fn>;
let signOutMock: ReturnType<typeof vi.fn> = vi.fn(async () => ({}));

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: 'user-123' } } },
      })),
      onAuthStateChange: vi.fn((callback: (event: string, session: { user: { id: string } } | null) => void) => {
        unsubscribeMock = vi.fn();
        // Immediately invoke handler with existing session to simulate update
        callback('SIGNED_IN', { user: { id: 'user-123' } });
        return { data: { subscription: { unsubscribe: unsubscribeMock } } };
      }),
      signOut: (...args: unknown[]) => signOutMock(...args),
    },
  },
}));

describe('authContext', () => {
  it('hydrates session and supports signOut', async () => {
    // Ensure React is available globally for JSX during test transforms
    // @ts-expect-error allow assignment for test
    global.React = React;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.id).toBe('user-123');

    await act(async () => {
      await result.current.signOut();
    });

    expect(signOutMock).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
