const fs = require('fs');
const path = require('path');
const vm = require('vm');

const tsFilePath = path.join(__dirname, '../src/data/services.ts');
const jsonFilePath = path.join(__dirname, '../data/services.json');

try {
  let tsContent = fs.readFileSync(tsFilePath, 'utf8');

  // Find the start of the array
  const arrayStartIndex = tsContent.indexOf('export const services: Service[] = [');
  if (arrayStartIndex === -1) {
    throw new Error('Could not find services array start');
  }

  // Keep only the array part
  tsContent = tsContent.substring(arrayStartIndex);

  // Remove type annotation and export
  // Matches: export const services: Service[] = [
  tsContent = tsContent.replace('export const services: Service[] =', 'var services =');

  // Create a sandbox to evaluate the code
  const sandbox = {};
  vm.createContext(sandbox);
  
  // Execute the modified content in the sandbox
  vm.runInContext(tsContent, sandbox);
  
  // Get the services array
  const services = sandbox.services;

  if (!services || !Array.isArray(services)) {
    throw new Error('Failed to extract services array');
  }

  console.log(`Found ${services.length} services.`);

  // Write to JSON
  fs.writeFileSync(jsonFilePath, JSON.stringify(services, null, 2));
  console.log(`Successfully wrote to ${jsonFilePath}`);

} catch (error) {
  console.error('Error converting services.ts:', error);
  process.exit(1);
}
