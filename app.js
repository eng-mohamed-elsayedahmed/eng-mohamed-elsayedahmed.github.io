/* Language and theme for the front door.
   Arabic copy is taken from the portfolio so both sites say the same thing. */

var AR = {
  'ctl.lang': 'English',
  'ctl.langTitle': 'تبديل اللغة',
  'name': 'محمد السيد',
  'nameAlt': 'محمد محمود السيد أحمد',
  'role': 'مطوّر فول ستاك وتطبيقات موبايل. أبني منصات ويب للمؤسسات بـ<b>Angular</b>، وتطبيقات موبايل بـ<b>Flutter</b>، وواجهات <b>PHP/Laravel</b> اللي وراها.',
  'cta.portfolio': 'افتح البورتفوليو ←',
  'cta.cv': 'حمّل السيرة الذاتية',
  'cta.talk': 'كلّمني',
  'fact.years': 'سنوات خبرة',
  'fact.projects': 'مشروع منجز',
  'fact.apps': 'تطبيق موبايل منشور',
  'fact.cityValue': 'القاهرة',
  'fact.city': 'مقيم في مصر وأعمل عن بُعد',
  'grp.stack': 'أدواتي',
  'stack.front': 'الواجهات الأمامية',
  'stack.mobile': 'الموبايل',
  'stack.back': 'الباك إند',
  'grp.work': 'مختارات من الشغل',
  'w1.cat': 'منتج — ERP مقاولات وتشطيبات',
  'w1.desc': 'منتج الشركة التجاري لشركات التشطيبات والديكور — المشروعات وبنود الأعمال والمقاولين والسندات والمصروفات والمدفوعات. مبني على كود Loom ERP الذي طوّرته.',
  'w2.cat': 'تطبيق موبايل — جودة التعليم',
  'w2.title': 'QMS عطاء — تطبيق إدارة الجودة',
  'w2.desc': 'تطبيق Flutter لجهة تعليمية سعودية: 18 وحدة تغطي الزيارات المدرسية والمعايير والتقييمات والخطط التصحيحية، بصلاحيات مرتبطة بالدور وواجهة عربية أولاً بدعم RTL.',
  'w3.cat': 'منصة تعليمية — السعودية',
  'w3.title': 'منصة عطاء ولوحة التحكم',
  'w3.desc': 'منصة ثنائية الوحدات: نظام إدارة الجودة للمعايير والزيارات المدرسية، ونظام التخطيط التشغيلي بإدارة حالة NgRx ولوحة تحكم إدارية وتقارير PDF.',
  'w4.cat': 'لوحة تحكم — استضافة ودومينات',
  'w4.desc': 'النظام الإداري لأعمال الاستضافة والدومينات: أكثر من 40 وحدة تشمل الطلبات والفواتير وخطط الاستضافة والدومينات والعملاء والحملات الإعلانية، مع تقارير بيانية.',
  'work.more': 'كل الـ16 مشروع في البورتفوليو',
  'grp.here': 'على هذا الدومين',
  'grp.away': 'أماكن أخرى',
  'r.portfolio': 'البورتفوليو الكامل — الأعمال والأدوات والخبرة ودراسات الحالة',
  'r.cv': 'السيرة الذاتية، صفحتان',
  'r.tools': 'ست أدوات في ملف واحد داخل المتصفح — التباين، JSON/CSV، واتساب، JWT، الصور، الروابط',
  'r.games': 'ست ألعاب صغيرة — الثعبان و2048 وكاسحة الألغام وBreakout والذاكرة وConnect Four',
  'r.linkedin': 'الملف المهني والتحديثات',
  'r.github': 'الكود المصدري للمواقع المستضافة هنا',
  'r.whatsapp': '+20 101 748 3005 — أسرع طريقة للتواصل',
  'foot.note': 'مبني ومستضاف من هذا المستودع.',
  'foot.cta': 'افتح البورتفوليو ←',
  'ctl.theme': { system: 'تلقائي', light: 'فاتح', dark: 'داكن' }
};

var EN_THEME = { system: 'System', light: 'Light', dark: 'Dark' };
var ICON = { system: '◐', light: '☀', dark: '☾' };

var en = {};   // filled from the markup on first load, so English needs no dictionary

function collect() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    en[el.getAttribute('data-i18n')] = el.innerHTML;
  });
  en['ctl.langTitle'] = document.getElementById('lang').getAttribute('title');
}

function applyLang(lang) {
  var isAr = lang === 'ar';
  document.documentElement.lang = isAr ? 'ar' : 'en';
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (key === 'ctl.theme') return;             // owned by the theme control
    var val = isAr ? AR[key] : en[key];
    if (val !== undefined) el.innerHTML = val;
  });
  var langBtn = document.getElementById('lang');
  langBtn.setAttribute('title', isAr ? AR['ctl.langTitle'] : en['ctl.langTitle']);
  document.querySelectorAll('.ar').forEach(function (el) {
    var t = el.textContent.trim();
    if (t === '→' || t === '←') el.textContent = isAr ? '←' : '→';
  });
  paintTheme();
  localStorage.setItem('lang', lang);
}

function currentTheme() {
  return localStorage.getItem('theme') || 'system';
}

function paintTheme() {
  var mode = currentTheme();
  var isAr = document.documentElement.lang === 'ar';
  var labels = isAr ? AR['ctl.theme'] : EN_THEME;
  document.querySelector('[data-ico="theme"]').textContent = ICON[mode];
  document.querySelector('#theme .ctl-lbl').textContent = labels[mode];
}

function applyTheme(mode) {
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
  }
  paintTheme();
}

collect();
applyLang(localStorage.getItem('lang') === 'ar' ? 'ar' : 'en');

document.getElementById('lang').addEventListener('click', function () {
  applyLang(document.documentElement.lang === 'ar' ? 'en' : 'ar');
});

document.getElementById('theme').addEventListener('click', function () {
  var order = ['system', 'light', 'dark'];
  applyTheme(order[(order.indexOf(currentTheme()) + 1) % order.length]);
});
