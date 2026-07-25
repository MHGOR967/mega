const crypto = require('crypto');

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN || "8961277817:AAEFIB-p-3_QV3lbvC7_3bfyx68f5NfckVM",
    DOMAIN: process.env.DOMAIN || "", // يجب تعيينه في Render
    PORT: process.env.PORT || 3000,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "8f7e2d9a4b5c6d1e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24 ساعة
};
