// Manual Jest mock for server/database/utils
// Provides jest.fn() placeholders for database functions used in tests.

// Note: This file is only used by Jest when tests call `jest.mock('../../database/utils')`.
// It intentionally uses `jest.fn()` which is provided by the Jest runtime.

module.exports = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn()
};
