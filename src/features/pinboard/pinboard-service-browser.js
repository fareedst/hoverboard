/**
 * Browser-Compatible PinboardService Mock
 * Simple mock for browser testing without Node.js dependencies
 */

export class PinboardService {
  constructor() {
    this.name = 'PinboardService (Browser Mock)';
  }

  async testConnection() {
    // Mock a successful connection test for browser testing
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🔗 Mock PinboardService: Connection test simulated (always returns true)');
        resolve(true);
      }, 500); // Simulate network delay
    });
  }

  // Add other methods as stubs if needed
  async getPosts() {
    throw new Error('getPosts not implemented in browser mock');
  }

  async addPost() {
    throw new Error('addPost not implemented in browser mock');
  }

  async deletePost() {
    throw new Error('deletePost not implemented in browser mock');
  }

  async getTags() {
    throw new Error('getTags not implemented in browser mock');
  }
}