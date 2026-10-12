const { Client, GatewayIntentBits, Partials, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
});

const PREFIX = "#";
const JAIL_ROLE_ID = "1543643112734203904"; 
const WELCOME_CHANNEL_ID = "1540698711955476512"; 
const SUPPORT_CHANNEL_ID = "1540698767169421445";
const RULES_CHANNEL_ID = "1540698714698551458";
const ALLOWED_ROLE_ID = "1540698608444117122";

const savedUserRoles = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// 1. نظام الترحيب مع الصورة والنص
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    try {
        const canvas = createCanvas(1024, 450);
        const ctx = canvas.getContext('2d');

        const background = await loadImage('./welcome.png');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.beginPath();
        ctx.arc(310, 225, 120, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, 190, 105, 240, 240);
        ctx.restore();

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome-image.png' });

        const welcomeMessage = `> **• اهـلا بـك فـي سـيـرفـر  __serpent community__  يا ${member}**
> 
> **• لشراء رتبة خاصة بك : <#${SUPPORT_CHANNEL_ID}>💸**
> 
> **• القوانين مـن هـنـا  : <#${RULES_CHANNEL_ID}>🗞️**
> 
> **• انت العضو رقم: ${member.guild.memberCount}🫧**
> 
> **• نتمنى لك تجربه ممتعه معنا🤍**`;

        channel.send({ content: welcomeMessage, files: [attachment] });
    } catch (error) {
        console.error("خطأ في الترحيب:", error);
    }
});

// 2. نظام الردود والأوامر بدون مشاكل الـ Reply
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // الرد على النقطة
    if (message.content.trim() === ".") {
        return message.channel.send("وش فيه الحلو يرسل نقطه؟");
    }

    // الرد على السلام
    if (message.content.includes("السلام عليكم")) {
        return message.channel.send("وعليكم السلام ورحمة الله وبركاته+منور");
    }

    // أمر السجن (.سجن @User)
    if (message.content.startsWith(PREFIX + "سجن")) {
        if (!message.member.roles.cache.has(ALLOWED_ROLE_ID) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send("عذراً، ليس لديك الرتبة المخصصة لاستخدام هذا الأمر.");
        }

        const target = message.mentions.members.first();
        if (!target) {
            return message.channel.send("يرجى منشن الشخص المراد سجنه! مثال: `#سجن @User`");
        }

        try {
            const oldRoleIds = target.roles.cache
                .filter(r => r.id !== message.guild.id)
                .map(r => r.id);

            savedUserRoles.set(target.id, oldRoleIds);

            await target.roles.remove(oldRoleIds);
            
            const jailRole = message.guild.roles.cache.get(JAIL_ROLE_ID);
            if (jailRole) {
                await target.roles.add(jailRole);
                message.channel.send(`تم سجن العضو ${target} بنجاح، وسحب جميع رولاته وإضافته للسجن.`);
            } else {
                message.channel.send("لم يتم العثور على رول السجن! تأكد من ضبط الآيدي في الكود.");
            }
        } catch (error) {
            console.error(error);
            message.channel.send("حدث خطأ! تأكد من صلاحيات البوت وترتيب الرتب.");
        }
    }

    // أمر فك السجن (#فك_سجن @User)
    if (message.content.startsWith(PREFIX + "#فك_سجن") || message.content.startsWith(PREFIX + "عفو")) {
        if (!message.member.roles.cache.has(ALLOWED_ROLE_ID) && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send("عذراً، ليس لديك الرتبة المخصصة لاستخدام هذا الأمر.");
        }

        const target = message.mentions.members.first();
        if (!target) {
            return message.channel.send("يرجى منشن الشخص المراد فك سجنه! مثال: `#فك_سجن @User`");
        }

        try {
            const jailRole = message.guild.roles.cache.get(JAIL_ROLE_ID);
            
            if (jailRole && target.roles.cache.has(JAIL_ROLE_ID)) {
                await target.roles.remove(jailRole);

                const previousRoles = savedUserRoles.get(target.id);
                if (previousRoles && previousRoles.length > 0) {
                    await target.roles.add(previousRoles);
                    savedUserRoles.delete(target.id);
                    message.channel.send(`تم فك سجن العضو ${target} بنجاح وإعادة جميع رولاته السابقة! 🎉`);
                } else {
                    message.channel.send(`تم فك سجن العضو ${target} بنجاح (لم يتم العثور على رولات قديمة مسجلة).`);
                }
            } else {
                message.channel.send("هذا العضو ليس مسجوناً بالأساس!");
            }
        } catch (error) {
            console.error(error);
            message.channel.send("حدث خطأ أثناء فك السجن! تأكد من صلاحيات البوت.");
        }
    }
});

client.login('client.login(process.env.DISCORD_TOKEN);');