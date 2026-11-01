const bcrypt = require('bcryptjs');

async function run() {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Original OTP: ", otpCode);

  const otpSalt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otpCode, otpSalt);
  console.log("Hash: ", otpHash);

  const providedOtp = otpCode.toString().trim();
  const isValid = await bcrypt.compare(providedOtp, otpHash);
  console.log("Is Valid: ", isValid);
}
run();
