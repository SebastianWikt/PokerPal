// Test data for E2E tests
module.exports = {
  // Test users for different scenarios
  users: {
    testUser: {
      computing_id: 'testuser123',
      first_name: 'Test',
      last_name: 'User',
      years_of_experience: 3,
      level: 'Intermediate',
      major: 'Computer Science',
      total_winnings: 150.00,
      is_admin: false
    },
    
    adminUser: {
      computing_id: 'admin123',
      first_name: 'Admin',
      last_name: 'User',
      years_of_experience: 10,
      level: 'Expert',
      major: 'Mathematics',
      total_winnings: 500.00,
      is_admin: true
    },
    
    newUser: {
      computing_id: 'newuser456',
      first_name: 'New',
      last_name: 'Player',
      years_of_experience: 1,
      level: 'Beginner',
      major: 'Engineering',
      total_winnings: 0.00,
      is_admin: false
    },
    
    playerWithNegativeWinnings: {
      computing_id: 'loser789',
      first_name: 'Unlucky',
      last_name: 'Player',
      years_of_experience: 2,
      level: 'Intermediate',
      major: 'Business',
      total_winnings: -75.00,
      is_admin: false
    }
  },
  
  // Test sessions
  sessions: {
    incompleteSession: {
      entry_id: 1,
      computing_id: 'testuser123',
      session_date: '2023-12-01',
      start_chips: 250.00,
      end_chips: null,
      net_winnings: null,
      is_completed: false
    },
    
    completedSession: {
      entry_id: 2,
      computing_id: 'testuser123',
      session_date: '2023-12-02',
      start_chips: 200.00,
      end_chips: 350.00,
      net_winnings: 150.00,
      is_completed: true
    }
  },
  
  // Chip values configuration
  chipValues: {
    red: 5.00,
    blue: 10.00,
    green: 25.00,
    black: 100.00,
    purple: 500.00
  },
  
  // Computer vision test results
  visionResults: {
    startChips: {
      chipCounts: {
        red: 10,
        blue: 5,
        green: 2,
        black: 1
      },
      totalValue: 250.00
    },
    
    endChips: {
      chipCounts: {
        red: 15,
        blue: 8,
        green: 4,
        black: 2
      },
      totalValue: 385.00
    }
  },
  
  // Timeout configurations
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    visionAnalysis: 15000
  },
  
  // API endpoints
  api: {
    baseUrl: 'http://localhost:3000/api',
    endpoints: {
      login: '/auth/login',
      logout: '/auth/logout',
      players: '/players',
      sessions: '/sessions',
      leaderboard: '/players/leaderboard',
      admin: '/admin',
      vision: '/vision/analyze'
    }
  },
  
  // File paths for test fixtures
  fixtures: {
    validImage: 'test/fixtures/test-chips.jpg',
    invalidImage: 'test/fixtures/invalid-file.txt',
    corruptedImage: 'test/fixtures/corrupted-image.jpg',
    endChipsImage: 'test/fixtures/test-chips-end.jpg'
  },
  
  // Form validation test data
  validation: {
    invalidComputingIds: ['ab', '12', 'x', ''],
    invalidNames: ['John123', 'D@e', '123', ''],
    invalidExperience: [-1, 51, 'abc', ''],
    validLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    invalidDates: ['invalid-date', '2023-13-01', '2023-02-30']
  }
};