const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your actual values from Apple Developer Console
const TEAM_ID = 'DAX56C9A62'; // Get from Apple Developer Console → Membership
const KEY_ID = 'LV29MFSHYY';   // Get from your Apple Sign-In key
const CLIENT_ID = 'com.applotictech.flexaura.signin'; // Your Services ID

// Path to your .p8 private key file
const PRIVATE_KEY_PATH = './apple_provider/AuthKey_LV29MFSHYY.p8'; // Your actual .p8 file

try {
  // Read the private key file content
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH).toString();

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const expirationTime = now + (60 * 60 * 24 * 180); // 6 months (max allowed by Apple)

  const clientSecret = jwt.sign(
    {
      iss: TEAM_ID,
      iat: now,
      exp: expirationTime,
      aud: 'https://appleid.apple.com',
      sub: CLIENT_ID,
    },
    privateKey,
    {
      algorithm: 'ES256',
      keyid: KEY_ID,
    }
  );

  console.log('✅ Generated Client Secret (JWT):');
  console.log('=====================================');
  console.log(clientSecret);
  console.log('=====================================');
  console.log('📋 Copy this JWT and paste it into Supabase "Secret Key (for OAuth)" field');
  
} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  console.log('\n📝 Make sure you have:');
  console.log('1. Installed jsonwebtoken: npm install jsonwebtoken');
  console.log('2. Updated the variables at the top of this script');
  console.log('3. Placed your .p8 file in the correct location');
}
