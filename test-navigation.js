// Tree Navigation Test Script for Platform Gateway
// Run this in browser console to test navigation functionality

console.log('🎯 Starting Platform Gateway Navigation Test...');

// Test 1: Check if navigation elements are present
const navGroups = document.querySelectorAll('.nav-group-toggle');
const navLinks = document.querySelectorAll('.nav-link');

console.log(`📊 Found ${navGroups.length} navigation groups`);
console.log(`📊 Found ${navLinks.length} navigation links`);

// Test 2: Test tree expansion/collapse
console.log('🔄 Testing navigation group expansion...');
navGroups.forEach((group, index) => {
  const sectionId = group.getAttribute('data-section');
  if (sectionId) {
    console.log(`  Group ${index + 1}: ${sectionId}`);
    
    // Test click
    setTimeout(() => {
      group.click();
      console.log(`    ✓ Clicked ${sectionId}`);
    }, index * 500);
  }
});

// Test 3: Test navigation links
console.log('🔗 Testing navigation links...');
navLinks.forEach((link, index) => {
  const page = link.getAttribute('data-page');
  if (page) {
    console.log(`  Link ${index + 1}: ${page} -> ${link.href}`);
  }
});

// Test 4: Test localStorage persistence
console.log('💾 Checking localStorage navigation state...');
const expandedSections = JSON.parse(localStorage.getItem('expandedNavSections') || '[]');
console.log('  Expanded sections:', expandedSections);

// Test 5: Test role-based access
console.log('🔐 Testing role-based navigation filtering...');
const userRoles = window.app ? window.app.currentUser?.roles : [];
console.log('  Current user roles:', userRoles);

// Test 6: Test page routing
console.log('🗺️ Testing page routing...');
const currentPage = window.app ? window.app.currentPage : 'unknown';
console.log('  Current page:', currentPage);

// Test 7: Test specific navigation paths
const testPaths = [
  'dashboard',
  'analytics', 
  'users',
  'users/create',
  'billing/overview',
  'api/keys'
];

console.log('🧪 Testing navigation paths...');
testPaths.forEach((path, index) => {
  setTimeout(() => {
    window.location.hash = path;
    console.log(`  ✓ Navigated to: #${path}`);
  }, (navGroups.length + index) * 500 + 2000);
});

// Summary
setTimeout(() => {
  console.log('✅ Navigation test completed!');
  console.log('📋 Test Results:');
  console.log(`  - Navigation groups: ${navGroups.length}`);
  console.log(`  - Navigation links: ${navLinks.length}`);
  console.log(`  - Current page: ${window.app ? window.app.currentPage : 'N/A'}`);
  console.log(`  - User roles: ${userRoles ? userRoles.join(', ') : 'N/A'}`);
}, (testPaths.length + navGroups.length) * 500 + 3000);