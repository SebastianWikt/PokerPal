// Sample image data for computer vision testing
const fs = require('fs');
const path = require('path');

// Create mock image buffers for testing
const createMockImageBuffer = (width = 800, height = 600, format = 'JPEG') => {
  // Create a simple bitmap-like structure for testing
  const headerSize = 54; // Basic bitmap header
  const imageSize = width * height * 3; // RGB
  const fileSize = headerSize + imageSize;
  
  const buffer = Buffer.alloc(fileSize);
  
  // Write basic bitmap header (simplified)
  buffer.write('BM', 0); // Signature
  buffer.writeUInt32LE(fileSize, 2); // File size
  buffer.writeUInt32LE(headerSize, 10); // Data offset
  buffer.writeUInt32LE(40, 14); // Header size
  buffer.writeUInt32LE(width, 18); // Width
  buffer.writeUInt32LE(height, 22); // Height
  buffer.writeUInt16LE(1, 26); // Planes
  buffer.writeUInt16LE(24, 28); // Bits per pixel
  
  // Fill with sample pixel data (creates a gradient pattern)
  for (let i = headerSize; i < fileSize; i += 3) {
    const position = (i - headerSize) / 3;
    const x = position % width;
    const y = Math.floor(position / width);
    
    // Create a simple pattern
    buffer[i] = (x * 255) / width; // Red
    buffer[i + 1] = (y * 255) / height; // Green
    buffer[i + 2] = 128; // Blue
  }
  
  return buffer;
};

// Sample images for different test scenarios
const sampleImages = {
  // Image with multiple chip colors
  multipleChips: createMockImageBuffer(800, 600),
  
  // Image with single chip color
  singleChip: createMockImageBuffer(400, 300),
  
  // Empty table (no chips)
  emptyTable: createMockImageBuffer(640, 480),
  
  // Blurry/low quality image
  blurryImage: createMockImageBuffer(320, 240),
  
  // Large high-resolution image
  highResImage: createMockImageBuffer(1920, 1080),
  
  // Small image
  smallImage: createMockImageBuffer(100, 100),
  
  // Corrupted image data
  corruptedImage: Buffer.from('This is not image data'),
  
  // Very large image (for size limit testing)
  oversizedImage: createMockImageBuffer(4000, 3000)
};

// Expected computer vision results for each sample image
const expectedResults = {
  multipleChips: {
    chipCounts: {
      red: 8,
      blue: 5,
      green: 3,
      black: 2
    },
    confidence: 0.85,
    processingTime: 1200
  },
  
  singleChip: {
    chipCounts: {
      red: 12
    },
    confidence: 0.92,
    processingTime: 800
  },
  
  emptyTable: {
    chipCounts: {},
    confidence: 0.95,
    processingTime: 600
  },
  
  blurryImage: {
    chipCounts: {
      red: 3,
      blue: 1
    },
    confidence: 0.45,
    processingTime: 1800
  },
  
  highResImage: {
    chipCounts: {
      red: 15,
      blue: 10,
      green: 8,
      black: 5,
      white: 2
    },
    confidence: 0.88,
    processingTime: 2500
  },
  
  smallImage: {
    chipCounts: {
      red: 2
    },
    confidence: 0.65,
    processingTime: 400
  }
};

// Test scenarios for different chip configurations
const testScenarios = [
  {
    name: 'High value stack',
    description: 'Player with mostly high-value chips',
    chipCounts: { black: 5, green: 3, blue: 2 },
    expectedValue: 580.00 // (5*100) + (3*25) + (2*10)
  },
  {
    name: 'Low value stack',
    description: 'Player with mostly low-value chips',
    chipCounts: { red: 20, blue: 5 },
    expectedValue: 150.00 // (20*5) + (5*10)
  },
  {
    name: 'Mixed stack',
    description: 'Player with mixed chip values',
    chipCounts: { red: 10, blue: 8, green: 4, black: 2 },
    expectedValue: 380.00 // (10*5) + (8*10) + (4*25) + (2*100)
  },
  {
    name: 'Empty stack',
    description: 'No chips detected',
    chipCounts: {},
    expectedValue: 0.00
  },
  {
    name: 'Unknown chips',
    description: 'Contains unknown chip colors',
    chipCounts: { red: 5, yellow: 3, purple: 2 },
    expectedValue: 25.00, // Only red chips counted
    warnings: ['Unknown chip color detected: yellow', 'Unknown chip color detected: purple']
  }
];

module.exports = {
  sampleImages,
  expectedResults,
  testScenarios,
  createMockImageBuffer
};