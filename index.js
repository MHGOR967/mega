const { Telegraf } = require('telegraf');
const express = require('express');
const config = require('./src/core/config');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(config.BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تحميل الموديولات تلقائياً
const modulesPath = path.join(__dirname, 'src/modules');
const modules = fs.readdirSync(modulesPath);

console.log('--- جاري تحميل الخدمات ---');
modules.forEach(moduleName => {
    const modulePath = path.join(modulesPath, moduleName);
    if (fs.statSync(modulePath).isDirectory()) {
        const initFile = path.join(modulePath, 'index.js');
        if (fs.existsSync(initFile)) {
            const moduleInit = require(initFile);
            moduleInit(bot, app);
            console.log(`✅ تم تحميل الخدمة: ${moduleName}`);
        }
    }
});
console.log('--- تم تحميل جميع الخدمات بنجاح ---');

bot.command('start', (ctx) => {
    ctx.reply("🚀 مرحباً بك في بوت الخدمات المتكامل. استخدم الأوامر المتاحة للوصول للخدمات.");
});

app.get('/', (req, res) => {
    res.send('Mega Bot Service is Running!');
});

app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
    bot.launch();
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
