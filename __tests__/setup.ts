// Global test setup — runs before every test file
// Provides deterministic environment variables and mock cleanup

// Deterministic encryption key (64-char hex = 32 bytes for AES-256)
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env["APP_PASSWORD"] ??= "placeholder-public-password";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

afterEach(() => {
  vi.restoreAllMocks();
});
