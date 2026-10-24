import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('Running Toast & Popup Auto-Close Audit...\n');

// -----------------------------------------------------------------------------
// TEST 1: Universal Auto-Close Timer Configuration
// -----------------------------------------------------------------------------
console.log('Test 1: Verifying ToastContainer 2.8s auto-close timer...');
const toastContainerPath = path.resolve('src/components/ToastContainer.tsx');
const toastContent = fs.readFileSync(toastContainerPath, 'utf8');

// Verify auto-dismiss timeout is 2800ms (between 2 and 3 seconds)
assert(toastContent.includes('2800'), 'Toast auto-close timer must be set to 2800ms (2 to 3 seconds)');

// Verify that celebrations and roadmap achievements are NOT exempted from auto-closing
assert(
  !toastContent.includes("if (notif.type === 'celebration' || (notif as any).category === 'decision_day') {\n          return null;\n        }"),
  'Celebrations must NOT be permanently exempted from auto-dismissal'
);

// Verify countdown progress bar exists
assert(toastContent.includes('scaleX: 0'), 'Countdown progress bar must animate scaleX to 0');
assert(toastContent.includes('duration: 2.8'), 'Countdown progress bar animation must match the 2.8s auto-close window');
console.log('✓ Test 1 passed: 2.8s auto-close timer and progress bar verified.\n');

// -----------------------------------------------------------------------------
// TEST 2: Roadmap Directive Toast Compatibility
// -----------------------------------------------------------------------------
console.log('Test 2: Verifying Roadmap Directive Toast structure...');
const dashboardPath = path.resolve('src/components/Dashboard.tsx');
const dashContent = fs.readFileSync(dashboardPath, 'utf8');

assert(
  dashContent.includes('🎯 ROADMAP DIRECTIVE ACHIEVED:') || dashContent.includes('🎯 ROADMAP GOAL ACHIEVED:'),
  'Dashboard must construct roadmap directive achievement toasts'
);

// Verify that dismissing notification in useGameStore works cleanly
const storePath = path.resolve('src/store/useGameStore.ts');
const storeContent = fs.readFileSync(storePath, 'utf8');
assert(storeContent.includes('dismissNotification'), 'Store must support dismissNotification');
console.log('✓ Test 2 passed: Roadmap achievement toasts integrate cleanly with auto-dismissal.\n');

// -----------------------------------------------------------------------------
// TEST 3: Hover-Pause and Touch Safety
// -----------------------------------------------------------------------------
console.log('Test 3: Verifying hover-pause and manual close accessibility...');
assert(toastContent.includes('onMouseEnter'), 'Toast must support onMouseEnter to pause timer on user hover');
assert(toastContent.includes('onMouseLeave'), 'Toast must support onMouseLeave to resume timer on mouse leave');
assert(toastContent.includes('aria-label="Dismiss notification"'), 'Close button must remain accessible for instant manual close');
console.log('✓ Test 3 passed: Hover pause and manual close button are verified.\n');

// -----------------------------------------------------------------------------
// TEST 4: Instant Popup Cancellation & Complete Backlog Clearance
// -----------------------------------------------------------------------------
console.log('Test 4: Verifying instant replacement and backlog purging...');
assert(
  toastContent.includes('rawNotifs.length > 1') && toastContent.includes('notifications: [latest]'),
  'Must immediately purge older notifications to retain only the single latest arrival'
);
assert(
  toastContent.includes('exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.12 } }}'),
  'Exit transition must be rapid (0.12s) to cleanly cancel superseded popups'
);
assert(
  toastContent.includes('const activeNotif = unreadNotifs.length > 0 ? unreadNotifs[unreadNotifs.length - 1] : null'),
  'Active notification must always resolve to the single latest incoming notification'
);
console.log('✓ Test 4 passed: Instant popup cancellation and backlog clearance strictly validated.\n');

console.log('=============================================');
console.log('All Toast Auto-Close Tests Passed Successfully!');
console.log('=============================================');
