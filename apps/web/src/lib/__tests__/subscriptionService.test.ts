import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCheckoutSession, createCustomerPortalSession } from '../subscriptionService';

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: () => (getSessionMock as ReturnType<typeof vi.fn>)(),
    },
  },
}));

let fetchMock: ReturnType<typeof vi.fn>;
const originalWindow = globalThis.window;

describe('subscriptionService checkout helpers', () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    // Minimal window object for origin usage
    globalThis.window = { location: { origin: 'http://localhost' } } as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.window = originalWindow;
  });

  it('builds checkout session request with auth token and returns URL', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.test' }),
    });

    const result = await createCheckoutSession('price_123');

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toBe('https://checkout.test');
  });

  it('returns null when checkout response is not ok', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'boom' }),
    });

    const result = await createCheckoutSession('price_123');
    expect(result).toBeNull();
  });

  it('returns null when no auth session is present', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    const result = await createCheckoutSession('price_123');
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates customer portal when authenticated', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://portal.test' }),
    });

    const result = await createCustomerPortalSession();

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-portal`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toBe('https://portal.test');
  });

  it('returns null when portal response is not ok', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } });
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'fail' }),
    });

    const result = await createCustomerPortalSession();
    expect(result).toBeNull();
  });
});
