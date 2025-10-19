// State persistence test utility
export const testStatePersistence = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🧪 State Persistence Test Utility Loaded');
  
  // Add to window for manual testing
  (window as any).testState = {
    logLocalStorage: () => {
      console.log('📦 Local Storage Contents:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          console.log(`  ${key}:`, localStorage.getItem(key));
        }
      }
    },
    
    logSessionStorage: () => {
      console.log('📦 Session Storage Contents:');
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          console.log(`  ${key}:`, sessionStorage.getItem(key));
        }
      }
    },
    
    simulateRefresh: () => {
      console.log('🔄 Simulating page refresh...');
      window.location.reload();
    },
    
    clearCache: () => {
      console.log('🧹 Clearing all storage...');
      localStorage.clear();
      sessionStorage.clear();
      // Clear any cache API if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    }
  };
  
  console.log('🔧 Test commands available:');
  console.log('  window.testState.logLocalStorage() - View localStorage');
  console.log('  window.testState.logSessionStorage() - View sessionStorage');
  console.log('  window.testState.simulateRefresh() - Refresh page');
  console.log('  window.testState.clearCache() - Clear all storage');
};

export default testStatePersistence;
