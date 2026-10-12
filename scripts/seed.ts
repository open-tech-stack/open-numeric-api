/**
 * Seed Open Numeric — injecte les données initiales dans la base.
 *
 * Usage :
 *   npx tsx scripts/seed.ts              # seed normal
 *   npx tsx scripts/seed.ts --reset      # vide tout d'abord
 *
 * Le script est IDEMPOTENT : relancer ne crée pas de doublons
 * (utilise `upsert` partout).
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';
import {
    SUPPORTED_LOCALES,
    type Locale,
} from '../src/common/types/locale.type.js';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const RESET = process.argv.includes('--reset');

/* =========================================================
   HELPERS
   ========================================================= */

/** Construit un tableau de traductions pour une locale donnée */
function T<TData extends Record<string, unknown>>(
  locale: Locale,
  data: TData,
): { locale: Locale } & TData {
  return { locale, ...data };
}

/* =========================================================
   TYPES INTERNES DU SEED
   ========================================================= */

interface SeedTranslation {
  locale: Locale;
}

interface ServiceItemSeed {
  key: string;
  image?: string;
  icon?: string;
  order: number;
  translations: (SeedTranslation & {
    name: string;
    description: string;
  })[];
}

interface ServiceCategorySeed {
  key: string;
  icon: string;
  accent: string;
  order: number;
  translations: (SeedTranslation & {
    name: string;
    description: string;
  })[];
  items: ServiceItemSeed[];
}

interface ServiceSeed {
  key: string;
  slug: string;
  href: string;
  icon: string;
  accent: string;
  order: number;
  translations: (SeedTranslation & {
    name: string;
    heroTitle: string;
    heroTitleHighlight: string;
    heroSubtitle: string;
  })[];
  categories: ServiceCategorySeed[];
}
/* =========================================================
   1. RESET (optionnel)
   ========================================================= */
async function resetDatabase() {
    console.log('🧹 Nettoyage de la base…');

    // Ordre : enfants → parents (respecte les FK)
    await prisma.projectLink.deleteMany();
    await prisma.projectFeatureTranslation.deleteMany();
    await prisma.projectFeature.deleteMany();
    await prisma.projectGalleryTranslation.deleteMany();
    await prisma.projectGallery.deleteMany();
    await prisma.projectTranslation.deleteMany();
    await prisma.project.deleteMany();

    await prisma.serviceItemTranslation.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.serviceCategoryTranslation.deleteMany();
    await prisma.serviceCategory.deleteMany();
    await prisma.serviceTranslation.deleteMany();
    await prisma.service.deleteMany();

    await prisma.teamMemberTranslation.deleteMany();
    await prisma.teamMember.deleteMany();

    await prisma.client.deleteMany();

    await prisma.testimonialTranslation.deleteMany();
    await prisma.testimonial.deleteMany();

    await prisma.socialTranslation.deleteMany();
    await prisma.social.deleteMany();

    await prisma.navItemTranslation.deleteMany();
    await prisma.navItem.deleteMany();

    await prisma.siteSettingsTranslation.deleteMany();
    await prisma.siteSettings.deleteMany();

    await prisma.contactSubmission.deleteMany();
    await prisma.quoteRequest.deleteMany();

    // Admin : on garde sauf si demandé explicitement
    // await prisma.admin.deleteMany();

    console.log('✅ Base nettoyée.');
}

/* =========================================================
   2. ADMIN PAR DÉFAUT
   ========================================================= */
async function seedAdmin() {
    console.log('👤 Admin par défaut…');

    const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
    const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? 'Super Admin';
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@open-numeric.com';

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
        console.log(`   ⏩ Admin "${username}" existe déjà.`);
        return existing;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
        data: {
            username,
            passwordHash,
            displayName,
            email,
            role: 'ADMIN',
        },
    });

    console.log(`   ✅ Admin créé : ${username} / ${password}`);
    return admin;
}

/* =========================================================
   3. SITE SETTINGS
   ========================================================= */
async function seedSiteSettings(adminId: string) {
    console.log('⚙️  Site Settings…');

    const translations = [
        T('fr', {
            tagline: 'Votre partenaire digital au Burkina Faso',
            about:
                'Open Numeric accompagne les entreprises dans leur transformation digitale avec des solutions sur mesure.',
        }),
        T('en', {
            tagline: 'Your digital partner in Burkina Faso',
            about:
                'Open Numeric supports businesses in their digital transformation with tailor-made solutions.',
        }),
        T('de', {
            tagline: 'Ihr digitaler Partner in Burkina Faso',
            about:
                'Open Numeric unterstützt Unternehmen bei ihrer digitalen Transformation mit maßgeschneiderten Lösungen.',
        }),
        T('zh', {
            tagline: '您在布基纳法索的数字合作伙伴',
            about: 'Open Numeric 通过量身定制的解决方案助力企业完成数字化转型。',
        }),
        T('es', {
            tagline: 'Tu socio digital en Burkina Faso',
            about:
                'Open Numeric acompaña a las empresas en su transformación digital con soluciones a medida.',
        }),
    ];

    const settings = await prisma.siteSettings.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            siteName: 'Open Numeric',
            logo: '/images/logo.png',
            favicon: '/favicon.ico',
            email: 'tech00.02in@gmail.com',
            emailSecondary: 'etannestor45@gmail.com',
            phone: '+226 65 03 37 42',
            phoneSecondary: '+226 61 78 03 91',
            whatsapp: '+22665033742',
            whatsappSecondary: '+22661780391',
            address: 'SOMGANDE, Ouagadougou, Burkina Faso',
            availability: '24/7',
            defaultMetaTitle: 'Open Numeric — Solutions Numériques',
            defaultMetaDescription:
                'Développement, design, formation et maintenance pour propulser votre entreprise à l’ère digitale.',
            updatedById: adminId,
        },
        update: {},
    });

    for (const tr of translations) {
        await prisma.siteSettingsTranslation.upsert({
            where: {
                siteSettingsId_locale: {
                    siteSettingsId: settings.id,
                    locale: tr.locale,
                },
            },
            create: {
                siteSettingsId: settings.id,
                locale: tr.locale,
                tagline: (tr.tagline as string) ?? null,
                about: (tr.about as string) ?? null,
            },
            update: {
                tagline: (tr.tagline as string) ?? null,
                about: (tr.about as string) ?? null,
            },
        });
    }

    console.log('   ✅ Site Settings prêts.');
}

/* =========================================================
   4. NAVIGATION
   ========================================================= */
async function seedNavigation(adminId: string) {
    console.log('🧭 Navigation…');

    const items = [
        {
            key: 'home',
            href: '/',
            order: 0,
            translations: [
                T('fr', { label: 'Accueil' }),
                T('en', { label: 'Home' }),
                T('de', { label: 'Startseite' }),
                T('zh', { label: '首页' }),
                T('es', { label: 'Inicio' }),
            ],
        },
        {
            key: 'services',
            href: '/services',
            order: 1,
            translations: [
                T('fr', { label: 'Services' }),
                T('en', { label: 'Services' }),
                T('de', { label: 'Dienstleistungen' }),
                T('zh', { label: '服务' }),
                T('es', { label: 'Servicios' }),
            ],
        },
        {
            key: 'portfolio',
            href: '/portfolio',
            order: 2,
            translations: [
                T('fr', { label: 'Portfolio' }),
                T('en', { label: 'Portfolio' }),
                T('de', { label: 'Portfolio' }),
                T('zh', { label: '作品集' }),
                T('es', { label: 'Portafolio' }),
            ],
        },
        {
            key: 'about',
            href: '/a-propos',
            order: 3,
            translations: [
                T('fr', { label: 'À propos' }),
                T('en', { label: 'About' }),
                T('de', { label: 'Über uns' }),
                T('zh', { label: '关于我们' }),
                T('es', { label: 'Nosotros' }),
            ],
        },
        {
            key: 'contact',
            href: '/contact',
            order: 4,
            translations: [
                T('fr', { label: 'Contact' }),
                T('en', { label: 'Contact' }),
                T('de', { label: 'Kontakt' }),
                T('zh', { label: '联系我们' }),
                T('es', { label: 'Contacto' }),
            ],
        },
    ];

    for (const item of items) {
        const existing = await prisma.navItem.findUnique({
            where: { key: item.key },
        });
        if (existing) {
            console.log(`   ⏩ NavItem "${item.key}" existe déjà.`);
            continue;
        }

        await prisma.navItem.create({
            data: {
                key: item.key,
                href: item.href,
                order: item.order,
                isActive: true,
                authorId: adminId,
                translations: {
                    create: item.translations.map((t) => ({
                        locale: t.locale,
                        label: (t.label as string) ?? '',
                    })),
                },
            },
        });
    }

    console.log('   ✅ Navigation prête.');
}

/* =========================================================
   5. SOCIALS
   ========================================================= */
async function seedSocials(adminId: string) {
    console.log('🔗 Réseaux sociaux…');

    const socials = [
        {
            key: 'facebook',
            icon: 'Facebook',
            url: 'https://facebook.com/open-numeric',
            hoverColor: 'hover:text-blue-600',
            order: 0,
            name: 'Facebook',
        },
        {
            key: 'twitter',
            icon: 'Twitter',
            url: 'https://twitter.com/open_numeric',
            hoverColor: 'hover:text-sky-500',
            order: 1,
            name: 'Twitter / X',
        },
        {
            key: 'linkedin',
            icon: 'Linkedin',
            url: 'https://linkedin.com/company/open-numeric',
            hoverColor: 'hover:text-blue-700',
            order: 2,
            name: 'LinkedIn',
        },
        {
            key: 'instagram',
            icon: 'Instagram',
            url: 'https://instagram.com/open.numeric',
            hoverColor: 'hover:text-pink-600',
            order: 3,
            name: 'Instagram',
        },
    ];

    for (const s of socials) {
        const existing = await prisma.social.findUnique({ where: { key: s.key } });
        if (existing) {
            console.log(`   ⏩ Social "${s.key}" existe déjà.`);
            continue;
        }

        await prisma.social.create({
            data: {
                key: s.key,
                icon: s.icon,
                url: s.url,
                hoverColor: s.hoverColor,
                order: s.order,
                isActive: true,
                authorId: adminId,
                translations: {
                    create: SUPPORTED_LOCALES.map((locale) => ({
                        locale,
                        name: s.name,
                    })),
                },
            },
        });
    }

    console.log('   ✅ Réseaux sociaux prêts.');
}

/* =========================================================
   6. CLIENTS
   ========================================================= */
async function seedClients(adminId: string) {
    console.log('🏢 Clients…');

    const clients = [
        { name: 'TechCorp', logo: '/images/custo1.png', url: '#' },
        { name: 'Innovate', logo: '/images/custo2.png', url: '#' },
        { name: 'DigitalSphere', logo: '/images/custo3.jpg', url: '#' },
        { name: 'WebSolutions', logo: '/images/custo4.jpg', url: '#' },
        { name: 'FutureNow', logo: '/images/custo5.jpg', url: '#' },
    ];

    for (let i = 0; i < clients.length; i++) {
        const c = clients[i];
        const existing = await prisma.client.findFirst({
            where: { name: c.name },
        });
        if (existing) {
            console.log(`   ⏩ Client "${c.name}" existe déjà.`);
            continue;
        }

        await prisma.client.create({
            data: {
                name: c.name,
                logo: c.logo,
                url: c.url,
                order: i,
                isActive: true,
                authorId: adminId,
            },
        });
    }

    console.log('   ✅ Clients prêts.');
}

/* =========================================================
   7. TEAM MEMBERS
   ========================================================= */
async function seedTeam(adminId: string) {
    console.log('👥 Équipe…');

    const members = [
        {
            key: 'ceo',
            image: '/images/dev.jpg',
            linkedin: '#',
            twitter: '#',
            order: 0,
            translations: [
                T('fr', {
                    name: 'Nestor COMPAORE',
                    role: 'CEO & Développeur Principal',
                    bio: "Expert en développement full-stack avec 4 ans d'expérience.",
                }),
                T('en', {
                    name: 'Nestor COMPAORE',
                    role: 'CEO & Lead Developer',
                    bio: 'Full-stack development expert with 4 years of experience.',
                }),
                T('de', {
                    name: 'Nestor COMPAORE',
                    role: 'CEO & Lead-Entwickler',
                    bio: 'Full-Stack-Entwicklungsexperte mit 4 Jahren Erfahrung.',
                }),
                T('zh', {
                    name: 'Nestor COMPAORE',
                    role: 'CEO 兼首席开发',
                    bio: '全栈开发专家，拥有 4 年经验。',
                }),
                T('es', {
                    name: 'Nestor COMPAORE',
                    role: 'CEO y Desarrollador Principal',
                    bio: 'Experto en desarrollo full-stack con 4 años de experiencia.',
                }),
            ],
        },
        {
            key: 'designer',
            image: '/images/designer.jpg',
            linkedin: '#',
            twitter: '#',
            order: 1,
            translations: [
                T('fr', {
                    name: 'Sophie Martin',
                    role: 'Designer UX/UI',
                    bio: "Spécialiste en design d'interface et expérience utilisateur.",
                }),
                T('en', {
                    name: 'Sophie Martin',
                    role: 'UX/UI Designer',
                    bio: 'Specialist in interface design and user experience.',
                }),
                T('de', {
                    name: 'Sophie Martin',
                    role: 'UX/UI Designerin',
                    bio: 'Spezialistin für Interface-Design und User Experience.',
                }),
                T('zh', {
                    name: 'Sophie Martin',
                    role: 'UX/UI 设计师',
                    bio: '界面设计和用户体验专家。',
                }),
                T('es', {
                    name: 'Sophie Martin',
                    role: 'Diseñadora UX/UI',
                    bio: 'Especialista en diseño de interfaces y experiencia de usuario.',
                }),
            ],
        },
        {
            key: 'trainer',
            image: '/images/formateur.jpg',
            linkedin: '#',
            twitter: '#',
            order: 2,
            translations: [
                T('fr', {
                    name: 'Thomas Leroy',
                    role: 'Responsable Formation',
                    bio: 'Formateur certifié avec une approche pédagogique adaptée.',
                }),
                T('en', {
                    name: 'Thomas Leroy',
                    role: 'Training Manager',
                    bio: 'Certified trainer with an adapted teaching approach.',
                }),
                T('de', {
                    name: 'Thomas Leroy',
                    role: 'Schulungsleiter',
                    bio: 'Zertifizierter Trainer mit angepasster Pädagogik.',
                }),
                T('zh', {
                    name: 'Thomas Leroy',
                    role: '培训经理',
                    bio: '认证培训师，教学方式灵活。',
                }),
                T('es', {
                    name: 'Thomas Leroy',
                    role: 'Responsable de Formación',
                    bio: 'Formador certificado con enfoque pedagógico adaptado.',
                }),
            ],
        },
        {
            key: 'support',
            image: '/images/maintient.jpg',
            linkedin: '#',
            twitter: '#',
            order: 3,
            translations: [
                T('fr', {
                    name: 'Camille Petit',
                    role: 'Responsable Support Technique',
                    bio: 'Garante de la qualité et de la réactivité de notre support.',
                }),
                T('en', {
                    name: 'Camille Petit',
                    role: 'Technical Support Manager',
                    bio: 'Guarantor of the quality and responsiveness of our support.',
                }),
                T('de', {
                    name: 'Camille Petit',
                    role: 'Technischer Support',
                    bio: 'Garant für Qualität und Reaktionsfähigkeit unseres Supports.',
                }),
                T('zh', {
                    name: 'Camille Petit',
                    role: '技术支持经理',
                    bio: '保证客户支持的质量和响应速度。',
                }),
                T('es', {
                    name: 'Camille Petit',
                    role: 'Responsable de Soporte',
                    bio: 'Garante de la calidad y reactividad de nuestro soporte.',
                }),
            ],
        },
    ];

    for (const m of members) {
        const existing = await prisma.teamMember.findUnique({
            where: { key: m.key },
        });
        if (existing) {
            console.log(`   ⏩ Membre "${m.key}" existe déjà.`);
            continue;
        }

        await prisma.teamMember.create({
            data: {
                key: m.key,
                image: m.image,
                linkedin: m.linkedin,
                twitter: m.twitter,
                order: m.order,
                isActive: true,
                authorId: adminId,
                translations: {
                    create: m.translations.map((t) => ({
                        locale: t.locale,
                        name: (t.name as string) ?? '',
                        role: (t.role as string) ?? '',
                        bio: (t.bio as string) ?? '',
                    })),
                },
            },
        });
    }

    console.log('   ✅ Équipe prête.');
}

/* =========================================================
   8. TESTIMONIALS
   ========================================================= */
async function seedTestimonials(adminId: string) {
    console.log('💬 Témoignages…');

    const items = [
        {
            key: 't1',
            image: '/images/test2.jpg',
            rating: 5,
            order: 0,
            translations: [
                T('fr', {
                    quote:
                        'Open Numeric a transformé notre présence en ligne avec une application sur mesure qui a boosté nos ventes de 40%.',
                    author: 'Jean Lambert',
                    company: 'CEO, TechCorp',
                }),
                T('en', {
                    quote:
                        'Open Numeric transformed our online presence with a custom application that boosted our sales by 40%.',
                    author: 'Jean Lambert',
                    company: 'CEO, TechCorp',
                }),
                T('de', {
                    quote:
                        'Open Numeric hat unsere Online-Präsenz mit einer maßgeschneiderten App transformiert und unseren Umsatz um 40% gesteigert.',
                    author: 'Jean Lambert',
                    company: 'CEO, TechCorp',
                }),
                T('zh', {
                    quote: 'Open Numeric 通过定制应用改变了我们的在线形象，使销售额提升了 40%。',
                    author: 'Jean Lambert',
                    company: 'CEO, TechCorp',
                }),
                T('es', {
                    quote:
                        'Open Numeric transformó nuestra presencia online con una aplicación a medida que aumentó nuestras ventas un 40%.',
                    author: 'Jean Lambert',
                    company: 'CEO, TechCorp',
                }),
            ],
        },
        {
            key: 't2',
            image: '/images/test1.jpg',
            rating: 5,
            order: 1,
            translations: [
                T('fr', {
                    quote:
                        'Leur équipe de design a créé une identité visuelle qui représente parfaitement nos valeurs.',
                    author: 'Marie Dubois',
                    company: 'Directrice Marketing, Innovate',
                }),
                T('en', {
                    quote:
                        'Their design team created a visual identity that perfectly represents our values.',
                    author: 'Marie Dubois',
                    company: 'Marketing Director, Innovate',
                }),
                T('de', {
                    quote:
                        'Ihr Designteam hat eine visuelle Identität geschaffen, die unsere Werte perfekt repräsentiert.',
                    author: 'Marie Dubois',
                    company: 'Marketingleiterin, Innovate',
                }),
                T('zh', {
                    quote: '他们的设计团队打造了完美体现我们价值观的视觉识别。',
                    author: 'Marie Dubois',
                    company: '市场总监, Innovate',
                }),
                T('es', {
                    quote:
                        'Su equipo de diseño creó una identidad visual que representa perfectamente nuestros valores.',
                    author: 'Marie Dubois',
                    company: 'Directora de Marketing, Innovate',
                }),
            ],
        },
        {
            key: 't3',
            image: '/images/test3.jpg',
            rating: 5,
            order: 2,
            translations: [
                T('fr', {
                    quote:
                        'Les formations étaient parfaitement adaptées à nos besoins et ont permis à nos équipes de gagner en productivité.',
                    author: 'Pierre Garnier',
                    company: 'DRH, DigitalSphere',
                }),
                T('en', {
                    quote:
                        'The trainings were perfectly adapted to our needs and helped our teams gain productivity.',
                    author: 'Pierre Garnier',
                    company: 'HR Director, DigitalSphere',
                }),
                T('de', {
                    quote:
                        'Die Schulungen waren perfekt auf unsere Bedürfnisse zugeschnitten und haben unsere Teams produktiver gemacht.',
                    author: 'Pierre Garnier',
                    company: 'Personalleiter, DigitalSphere',
                }),
                T('zh', {
                    quote: '培训完全符合我们的需求，帮助我们的团队提高了生产力。',
                    author: 'Pierre Garnier',
                    company: '人力资源总监, DigitalSphere',
                }),
                T('es', {
                    quote:
                        'Las formaciones se adaptaron perfectamente a nuestras necesidades y aumentaron la productividad de nuestros equipos.',
                    author: 'Pierre Garnier',
                    company: 'Director de RRHH, DigitalSphere',
                }),
            ],
        },
    ];

    for (const t of items) {
        const existing = await prisma.testimonial.findUnique({
            where: { key: t.key },
        });
        if (existing) {
            console.log(`   ⏩ Témoignage "${t.key}" existe déjà.`);
            continue;
        }

        await prisma.testimonial.create({
            data: {
                key: t.key,
                image: t.image,
                rating: t.rating,
                order: t.order,
                isActive: true,
                authorId: adminId,
                translations: {
                    create: t.translations.map((tr) => ({
                        locale: tr.locale,
                        quote: (tr.quote as string) ?? '',
                        author: (tr.author as string) ?? '',
                        company: (tr.company as string) ?? '',
                    })),
                },
            },
        });
    }

    console.log('   ✅ Témoignages prêts.');
}

/* =========================================================
   9. SERVICES
   ========================================================= */
async function seedServices(adminId: string) {
    console.log('🛠️  Services…');

    const services: ServiceSeed[] = [
        {
            key: 'development',
            slug: 'developpement',
            href: '/services/developpement',
            icon: 'Code2',
            accent: 'from-blue-500 to-cyan-500',
            order: 0,
            translations: [
                T('fr', {
                    name: 'Développement',
                    heroTitle: 'Développement',
                    heroTitleHighlight: 'Logiciel',
                    heroSubtitle:
                        'Des solutions technologiques sur mesure pour propulser votre entreprise.',
                }),
                T('en', {
                    name: 'Development',
                    heroTitle: 'Software',
                    heroTitleHighlight: 'Development',
                    heroSubtitle:
                        'Custom technology solutions to propel your business forward.',
                }),
                T('de', {
                    name: 'Entwicklung',
                    heroTitle: 'Software-',
                    heroTitleHighlight: 'Entwicklung',
                    heroSubtitle:
                        'Maßgeschneiderte Technologielösungen für Ihr Unternehmen.',
                }),
                T('zh', {
                    name: '开发',
                    heroTitle: '软件',
                    heroTitleHighlight: '开发',
                    heroSubtitle: '量身定制的技术解决方案，助您的企业腾飞。',
                }),
                T('es', {
                    name: 'Desarrollo',
                    heroTitle: 'Desarrollo',
                    heroTitleHighlight: 'de Software',
                    heroSubtitle:
                        'Soluciones tecnológicas a medida para impulsar tu empresa.',
                }),
            ],
            categories: [
                {
                    key: 'frontend',
                    icon: 'Code2',
                    accent: 'from-blue-500 to-cyan-500',
                    order: 0,
                    translations: [
                        T('fr', { name: 'Frontend', description: 'Frameworks modernes' }),
                        T('en', { name: 'Frontend', description: 'Modern frameworks' }),
                        T('de', { name: 'Frontend', description: 'Moderne Frameworks' }),
                        T('zh', { name: '前端', description: '现代框架' }),
                        T('es', { name: 'Frontend', description: 'Frameworks modernos' }),
                    ],
                    items: [
                        {
                            key: 'react',
                            image: '/images/dev/react.png',
                            order: 0,
                            translations: [
                                T('fr', {
                                    name: 'React / Next.js',
                                    description: 'Frameworks performants SSR, ISR et SSG.',
                                }),
                                T('en', {
                                    name: 'React / Next.js',
                                    description: 'High-performance SSR, ISR and SSG frameworks.',
                                }),
                                T('de', {
                                    name: 'React / Next.js',
                                    description: 'Leistungsstarke SSR, ISR und SSG Frameworks.',
                                }),
                                T('zh', {
                                    name: 'React / Next.js',
                                    description: '高性能 SSR、ISR 和 SSG 框架。',
                                }),
                                T('es', {
                                    name: 'React / Next.js',
                                    description: 'Frameworks SSR, ISR y SSG de alto rendimiento.',
                                }),
                            ],
                        },
                        {
                            key: 'angular',
                            image: '/images/dev/angular1.png',
                            order: 1,
                            translations: [
                                T('fr', { name: 'Angular', description: 'Architecture solide et scalable.' }),
                                T('en', { name: 'Angular', description: 'Solid and scalable architecture.' }),
                                T('de', { name: 'Angular', description: 'Solide und skalierbare Architektur.' }),
                                T('zh', { name: 'Angular', description: '稳健且可扩展的架构。' }),
                                T('es', { name: 'Angular', description: 'Arquitectura sólida y escalable.' }),
                            ],
                        },
                    ],
                },
                {
                    key: 'backend',
                    icon: 'Server',
                    accent: 'from-emerald-500 to-teal-500',
                    order: 1,
                    translations: [
                        T('fr', { name: 'Backend', description: 'APIs et microservices' }),
                        T('en', { name: 'Backend', description: 'APIs and microservices' }),
                        T('de', { name: 'Backend', description: 'APIs und Microservices' }),
                        T('zh', { name: '后端', description: 'API 和微服务' }),
                        T('es', { name: 'Backend', description: 'APIs y microservicios' }),
                    ],
                    items: [
                        {
                            key: 'nest',
                            image: '/images/dev/nest.png',
                            order: 0,
                            translations: [
                                T('fr', { name: 'Node.js / NestJS', description: 'API TypeScript scalable.' }),
                                T('en', { name: 'Node.js / NestJS', description: 'Scalable TypeScript API.' }),
                                T('de', { name: 'Node.js / NestJS', description: 'Skalierbare TypeScript-API.' }),
                                T('zh', { name: 'Node.js / NestJS', description: '可扩展的 TypeScript API。' }),
                                T('es', { name: 'Node.js / NestJS', description: 'API TypeScript escalable.' }),
                            ],
                        },
                    ],
                },
            ],
        },
        {
            key: 'design',
            slug: 'design',
            href: '/services/design',
            icon: 'PenTool',
            accent: 'from-pink-500 to-purple-500',
            order: 1,
            translations: [
                T('fr', {
                    name: 'Design',
                    heroTitle: 'Design',
                    heroTitleHighlight: 'Créatif',
                    heroSubtitle:
                        'Des solutions design impactantes qui racontent votre histoire.',
                }),
                T('en', {
                    name: 'Design',
                    heroTitle: 'Creative',
                    heroTitleHighlight: 'Design',
                    heroSubtitle: 'Impactful design solutions that tell your story.',
                }),
                T('de', {
                    name: 'Design',
                    heroTitle: 'Kreatives',
                    heroTitleHighlight: 'Design',
                    heroSubtitle: 'Wirkungsvolle Designlösungen, die Ihre Geschichte erzählen.',
                }),
                T('zh', {
                    name: '设计',
                    heroTitle: '创意',
                    heroTitleHighlight: '设计',
                    heroSubtitle: '引人注目的设计解决方案，讲述您的故事。',
                }),
                T('es', {
                    name: 'Diseño',
                    heroTitle: 'Diseño',
                    heroTitleHighlight: 'Creativo',
                    heroSubtitle: 'Soluciones de diseño impactantes que cuentan tu historia.',
                }),
            ],
            categories: [
                {
                    key: 'branding',
                    icon: 'Palette',
                    accent: 'from-pink-500 to-rose-500',
                    order: 0,
                    translations: [
                        T('fr', { name: 'Branding', description: 'Identité visuelle' }),
                        T('en', { name: 'Branding', description: 'Visual identity' }),
                        T('de', { name: 'Branding', description: 'Visuelle Identität' }),
                        T('zh', { name: '品牌', description: '视觉识别' }),
                        T('es', { name: 'Branding', description: 'Identidad visual' }),
                    ],
                    items: [
                        {
                            key: 'logo',
                            icon: 'PenTool',
                            order: 0,
                            translations: [
                                T('fr', { name: 'Logo design', description: 'Logos mémorables.' }),
                                T('en', { name: 'Logo design', description: 'Memorable logos.' }),
                                T('de', { name: 'Logo-Design', description: 'Einprägsame Logos.' }),
                                T('zh', { name: '标志设计', description: '令人难忘的标志。' }),
                                T('es', { name: 'Diseño de logo', description: 'Logotipos memorables.' }),
                            ],
                        },
                    ],
                },
            ],
        },
        {
            key: 'training',
            slug: 'formation',
            href: '/services/formation',
            icon: 'GraduationCap',
            accent: 'from-cyan-500 to-blue-500',
            order: 2,
            translations: [
                T('fr', { name: 'Formations', heroTitle: 'Formations', heroTitleHighlight: 'Expertes', heroSubtitle: 'Montez en compétences avec nos programmes.' }),
                T('en', { name: 'Training', heroTitle: 'Expert', heroTitleHighlight: 'Training', heroSubtitle: 'Level up your skills with our programs.' }),
                T('de', { name: 'Schulungen', heroTitle: 'Experten-', heroTitleHighlight: 'Schulungen', heroSubtitle: 'Steigern Sie Ihre Fähigkeiten.' }),
                T('zh', { name: '培训', heroTitle: '专家', heroTitleHighlight: '培训', heroSubtitle: '通过我们的课程提升技能。' }),
                T('es', { name: 'Formación', heroTitle: 'Formación', heroTitleHighlight: 'Experta', heroSubtitle: 'Mejora tus habilidades con nuestros programas.' }),
            ],
            categories: [],
        },
        {
            key: 'maintenance',
            slug: 'maintenance',
            href: '/services/maintenance',
            icon: 'Wrench',
            accent: 'from-amber-500 to-orange-500',
            order: 3,
            translations: [
                T('fr', { name: 'Maintenance', heroTitle: 'Maintenance', heroTitleHighlight: 'Informatique', heroSubtitle: 'Réparation et entretien de vos équipements.' }),
                T('en', { name: 'Maintenance', heroTitle: 'IT', heroTitleHighlight: 'Maintenance', heroSubtitle: 'Repair and maintenance of your equipment.' }),
                T('de', { name: 'Wartung', heroTitle: 'IT-', heroTitleHighlight: 'Wartung', heroSubtitle: 'Reparatur und Wartung Ihrer Geräte.' }),
                T('zh', { name: '维护', heroTitle: 'IT', heroTitleHighlight: '维护', heroSubtitle: '您设备的维修和保养。' }),
                T('es', { name: 'Mantenimiento', heroTitle: 'Mantenimiento', heroTitleHighlight: 'Informático', heroSubtitle: 'Reparación y mantenimiento de sus equipos.' }),
            ],
            categories: [],
        },
        {
            key: 'shop',
            slug: 'vente',
            href: '/services/vente',
            icon: 'ShoppingBag',
            accent: 'from-red-500 to-amber-500',
            order: 4,
            translations: [
                T('fr', { name: 'Vente', heroTitle: 'Boutique', heroTitleHighlight: 'Professionnelle', heroSubtitle: 'Matériel informatique de qualité.' }),
                T('en', { name: 'Sales', heroTitle: 'Professional', heroTitleHighlight: 'Shop', heroSubtitle: 'Quality IT equipment.' }),
                T('de', { name: 'Verkauf', heroTitle: 'Professioneller', heroTitleHighlight: 'Shop', heroSubtitle: 'Hochwertige IT-Ausrüstung.' }),
                T('zh', { name: '销售', heroTitle: '专业', heroTitleHighlight: '商店', heroSubtitle: '优质 IT 设备。' }),
                T('es', { name: 'Ventas', heroTitle: 'Tienda', heroTitleHighlight: 'Profesional', heroSubtitle: 'Equipos informáticos de calidad.' }),
            ],
            categories: [],
        },
    ];

    for (const s of services) {
        const existing = await prisma.service.findUnique({ where: { key: s.key } });
        if (existing) {
            console.log(`   ⏩ Service "${s.key}" existe déjà.`);
            continue;
        }

        const created = await prisma.service.create({
            data: {
                key: s.key,
                slug: s.slug,
                href: s.href,
                icon: s.icon,
                accent: s.accent,
                order: s.order,
                isActive: true,
                authorId: adminId,
                translations: {
                    create: s.translations.map((t) => ({
                        locale: t.locale,
                        name: (t.name as string) ?? '',
                        heroTitle: (t.heroTitle as string) ?? null,
                        heroTitleHighlight: (t.heroTitleHighlight as string) ?? null,
                        heroSubtitle: (t.heroSubtitle as string) ?? null,
                    })),
                },
            },
        });

        for (const cat of s.categories) {
            await prisma.serviceCategory.create({
                data: {
                    serviceId: created.id,
                    key: cat.key,
                    icon: cat.icon,
                    accent: cat.accent,
                    order: cat.order,
                    translations: {
                        create: cat.translations.map((t) => ({
                            locale: t.locale,
                            name: (t.name as string) ?? '',
                            description: (t.description as string) ?? null,
                        })),
                    },
                    items: {
                        create: cat.items.map((it) => ({
                            key: it.key,
                            image: it.image ?? null,
                            icon: it.icon ?? null,
                            order: it.order,
                            translations: {
                                create: it.translations.map((t) => ({
                                    locale: t.locale,
                                    name: (t.name as string) ?? '',
                                    description: (t.description as string) ?? null,
                                })),
                            },
                        })),
                    },
                },
            });
        }
    }

    console.log('   ✅ Services prêts.');
}

/* =========================================================
   10. PROJECTS
   ========================================================= */
async function seedProjects(adminId: string) {
    console.log('📁 Projets…');

    const projects = [
        {
            slug: 'ecommerce-multi-vendeurs',
            cover: '/projects/ecommerce.jpg',
            heroImage: '/projects/ecommerce-hero.jpg',
            category: 'WEB' as const,
            scope: 'CLIENT' as const,
            status: 'COMPLETED' as const,
            year: 2025,
            tech: ['Next.js', 'NestJS', 'PostgreSQL', 'Stripe'],
            tags: ['E-commerce', 'Marketplace', 'Paiement'],
            featured: true,
            translations: [
                T('fr', {
                    title: 'Plateforme E-commerce Multi-vendeurs',
                    description: 'Marketplace complète avec paiement sécurisé.',
                    longDescription: 'Une plateforme marketplace complète permettant à plusieurs vendeurs de proposer leurs produits sur une seule boutique.',
                }),
                T('en', {
                    title: 'Multi-vendor E-commerce Platform',
                    description: 'Complete marketplace with secure payment.',
                    longDescription: 'A complete marketplace platform allowing multiple vendors to sell on one shop.',
                }),
            ],
            links: [
                { type: 'DEMO' as const, url: '#' },
                { type: 'ARTICLE' as const, url: '#' },
            ],
        },
        {
            slug: 'app-livraison-temps-reel',
            cover: '/projects/delivery-app.jpg',
            category: 'MOBILE' as const,
            scope: 'CLIENT' as const,
            status: 'COMPLETED' as const,
            year: 2025,
            tech: ['Flutter', 'Google Maps', 'Firebase'],
            tags: ['Livraison', 'GPS', 'Push'],
            featured: true,
            translations: [
                T('fr', { title: 'App de Livraison Temps Réel', description: 'Application avec suivi GPS en direct.' }),
                T('en', { title: 'Real-time Delivery App', description: 'Mobile app with live GPS tracking.' }),
            ],
            links: [{ type: 'DEMO' as const, url: '#' }],
        },
        {
            slug: 'api-paiement-mobile',
            cover: '/projects/api.jpg',
            category: 'API' as const,
            scope: 'CLIENT' as const,
            status: 'COMPLETED' as const,
            year: 2025,
            tech: ['Node.js', 'NestJS', 'Redis', 'PostgreSQL'],
            tags: ['Paiement', 'Fintech', 'Webhooks'],
            featured: true,
            translations: [
                T('fr', { title: 'API de Paiement Mobile', description: 'Passerelle unifiée pour Orange Money, Moov, Wave.' }),
                T('en', { title: 'Mobile Payment API', description: 'Unified gateway for Orange Money, Moov, Wave.' }),
            ],
            links: [
                { type: 'DEMO' as const, url: '#' },
                { type: 'DOC' as const, url: '#' },
            ],
        },
        {
            slug: 'open-numeric-ui',
            cover: '/projects/ui-kit.jpg',
            category: 'PACKAGE' as const,
            scope: 'OPEN_SOURCE' as const,
            status: 'IN_PROGRESS' as const,
            year: 2026,
            tech: ['React', 'Tailwind', 'Radix UI', 'TypeScript'],
            tags: ['Design System', 'React', 'A11y'],
            featured: true,
            translations: [
                T('fr', { title: 'Open Numeric UI Kit', description: 'Design system complet pour React.' }),
                T('en', { title: 'Open Numeric UI Kit', description: 'Complete design system for React.' }),
            ],
            links: [
                { type: 'GITHUB' as const, url: '#' },
                { type: 'NPM' as const, url: '#' },
            ],
        },
    ];

    for (const p of projects) {
        const existing = await prisma.project.findUnique({ where: { slug: p.slug } });
        if (existing) {
            console.log(`   ⏩ Projet "${p.slug}" existe déjà.`);
            continue;
        }

        await prisma.project.create({
            data: {
                slug: p.slug,
                cover: p.cover,
                heroImage: p.heroImage ?? null,
                category: p.category,
                scope: p.scope,
                status: p.status,
                year: p.year,
                tech: p.tech,
                tags: p.tags,
                featured: p.featured,
                order: 0,
                isActive: true,
                authorId: adminId,
                translations: {
                    create: p.translations.map((t) => ({
                        locale: t.locale,
                        title: (t.title as string) ?? '',
                        description: (t.description as string) ?? '',
                        longDescription: (t.description as string) ?? null,
                    })),
                },
                links: {
                    create: p.links.map((l) => ({
                        type: l.type,
                        url: l.url,
                        order: 0,
                    })),
                },
            },
        });
    }

    console.log('   ✅ Projets prêts.');
}

/* =========================================================
   MAIN
   ========================================================= */
async function main() {
    console.log('🌱 Seed Open Numeric\n');

    try {
        if (RESET) {
            await resetDatabase();
        }

        const admin = await seedAdmin();
        if (!admin) {
            console.log('❌ Admin introuvable. Arrêt.');
            return;
        }

        await seedSiteSettings(admin.id);
        await seedNavigation(admin.id);
        await seedSocials(admin.id);
        await seedClients(admin.id);
        await seedTeam(admin.id);
        await seedTestimonials(admin.id);
        await seedServices(admin.id);
        await seedProjects(admin.id);

        console.log('\n🎉 Seed terminé avec succès !');
        console.log('   Identifiants admin par défaut :');
        console.log(
            `     - username : ${process.env.SEED_ADMIN_USERNAME ?? 'admin'}`,
        );
        console.log(
            `     - password : ${process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'}`,
        );
    } catch (error) {
        console.error('\n❌ Erreur pendant le seed :');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();