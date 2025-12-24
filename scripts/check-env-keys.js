
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

console.log('Keys in .env:', Object.keys(process.env).filter(k => !['Path', 'OS', 'ComSpec', 'PATHEXT'].includes(k)));
