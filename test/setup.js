// Jest setup file for common test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests

// Global test utilities
global.testUtils = {
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    computing_id: 'test123',
    first_name: 'Test',
    last_name: 'User',
    total_winnings: 0.00,
    years_of_experience: 2,
    level: 'Intermediate',
    major: 'Computer Science',
    is_admin: false,
    ...overrides
  }),
  
  // Helper to create mock session data
  createMockSession: (overrides = {}) => ({
    entry_id: 1,
    computing_id: 'test123',
    session_date: '2023-12-01',
    start_chips: 250.00,
    end_chips: null,
    net_winnings: null,
    is_completed: false,
    ...overrides
  }),
  
  // Helper to create mock chip values
  createMockChipValues: () => [
    { color: 'red', value: 5.00 },
    { color: 'blue', value: 10.00 },
    { color: 'green', value: 25.00 },
    { color: 'black', value: 100.00 }
  ],
  
  // Helper to create JWT token for testing
  createTestToken: (payload = { computing_id: 'test123' }) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // Helper to create mock file buffer
  createMockImageBuffer: (size = 1024) => {
    return Buffer.alloc(size, 'fake image data');
  }
};

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress console output in tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for integration tests
jest.setTimeout(30000);