/**
 * Test script for Inventory V2 - validates inventoryStats API action
 * Run: node scripts/test-inventory-v2.js
 * Requires: local server running (vercel dev) on port 3000 OR set BASE_URL env
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testInventoryStats() {
  console.log('\n--- Test: inventoryStats ---');
  const res = await fetch(`${BASE_URL}/api/records?action=inventoryStats`);
  if (!res.ok) {
    console.error(`FAIL: HTTP ${res.status}`);
    const text = await res.text();
    console.error(text);
    return false;
  }
  const data = await res.json();
  const requiredFields = [
    'total_items', 'out_of_stock_count', 'low_stock_count',
    'expiring_soon_count', 'expired_count', 'movements_this_month', 'alert_batches'
  ];
  const missing = requiredFields.filter(f => !(f in data));
  if (missing.length > 0) {
    console.error('FAIL: Missing fields:', missing.join(', '));
    return false;
  }
  if (!Array.isArray(data.alert_batches)) {
    console.error('FAIL: alert_batches is not an array');
    return false;
  }
  console.log('PASS: inventoryStats returns expected structure');
  console.log(`  total_items:           ${data.total_items}`);
  console.log(`  out_of_stock_count:    ${data.out_of_stock_count}`);
  console.log(`  low_stock_count:       ${data.low_stock_count}`);
  console.log(`  expiring_soon_count:   ${data.expiring_soon_count}`);
  console.log(`  expired_count:         ${data.expired_count}`);
  console.log(`  movements_this_month:  ${data.movements_this_month}`);
  console.log(`  alert_batches.length:  ${data.alert_batches.length}`);
  return true;
}

async function testInventoryListItems() {
  console.log('\n--- Test: inventoryListItems ---');
  const res = await fetch(`${BASE_URL}/api/records?action=inventoryListItems`);
  if (!res.ok) {
    console.error(`FAIL: HTTP ${res.status}`);
    return false;
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error('FAIL: Expected array response');
    return false;
  }
  console.log(`PASS: inventoryListItems returned ${data.length} items`);
  if (data.length > 0) {
    const first = data[0];
    const itemFields = ['id', 'name', 'category', 'unit_of_measure', 'stock_quantity', 'min_stock_level'];
    const missingItemFields = itemFields.filter(f => !(f in first));
    if (missingItemFields.length > 0) {
      console.warn(`  WARN: First item missing fields: ${missingItemFields.join(', ')}`);
    } else {
      console.log('  First item structure: OK');
    }
  }
  return true;
}

async function runAll() {
  console.log(`Testing Inventory V2 API at: ${BASE_URL}`);
  const results = await Promise.allSettled([
    testInventoryStats(),
    testInventoryListItems(),
  ]);
  const passed = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - passed;
  console.log(`\n=============================`);
  console.log(`Results: ${passed}/${results.length} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runAll().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
