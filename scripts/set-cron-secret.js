import { execSync } from 'child_process';
import crypto from 'crypto';

// Generate a random secret
const secret = crypto.randomBytes(32).toString('hex');
console.log(`🔑 Generated Secret: ${secret}`);

const environments = ['production', 'preview', 'development'];

console.log('🚀 Setting CRON_SECRET in Vercel environments...');

try {
  environments.forEach(env => {
    console.log(`\nSetting for ${env}...`);
    // Use echo to pipe the value to vercel env add
    // Command format: echo "value" | vercel env add NAME target
    // Note: On Windows PowerShell, piping might behave differently, but node execSync uses cmd by default or shell.
    // Let's try a cross-platform approach or just standard shell piping.
    
    try {
      // Using input option of execSync to pass stdin
      execSync(`vercel env add CRON_SECRET ${env}`, { 
        input: secret,
        stdio: ['pipe', 'inherit', 'inherit'] 
      });
      console.log(`✅ Successfully set CRON_SECRET for ${env}`);
    } catch (e) {
      console.log(`⚠️ Failed to set for ${env} (might already exist). Trying to remove and re-add...`);
      try {
        execSync(`vercel env rm CRON_SECRET ${env} -y`, { stdio: 'inherit' });
        execSync(`vercel env add CRON_SECRET ${env}`, { 
          input: secret,
          stdio: ['pipe', 'inherit', 'inherit'] 
        });
        console.log(`✅ Successfully updated CRON_SECRET for ${env}`);
      } catch (err) {
        console.error(`❌ Error setting CRON_SECRET for ${env}:`, err.message);
      }
    }
  });

  console.log('\n🎉 Done! CRON_SECRET has been configured.');
  console.log('⚠️ IMPORTANT: You may need to redeploy for changes to take effect.');

} catch (error) {
  console.error('❌ Fatal Error:', error);
}
