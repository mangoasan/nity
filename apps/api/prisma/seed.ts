import 'dotenv/config';
import { PrismaClient, Role, AuthProvider, ClassLevel, Weekday } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const mastersSeed = [
  {
    key: 'akmaral',
    slug: 'akmaral',
    name: 'Акмарал',
    photoUrl: '/uploads/masters/akmaral.svg',
    shortBio: 'Мягкий и внимательный преподаватель хатха-йоги для комфортной регулярной практики.',
    fullBio:
      'Акмарал помогает выстроить устойчивую практику без спешки и перегрузки. На ее занятиях много внимания дыханию, технике и бережной работе с телом.',
    specialties: ['Хатха-йога', 'Дыхательные практики', 'Мягкий старт'],
  },
  {
    key: 'zhanara',
    slug: 'zhanara',
    name: 'Жанара',
    photoUrl: '/uploads/masters/Жанара.png',
    shortBio: 'Ведет динамичные классы с акцентом на силу, выносливость и хороший темп.',
    fullBio:
      'Жанара любит собранные и энергичные практики. Ее занятия подходят тем, кто хочет сочетать интенсивность, точность и красивый поток движений.',
    specialties: ['Виньяса', 'Силовая йога', 'Флоу-практика'],
  },
  {
    key: 'shugyla',
    slug: 'shugyla',
    name: 'Шугыла',
    photoUrl: '/uploads/masters/Шугыла.png',
    shortBio: 'Специализируется на расслабляющих форматах и глубокой восстановительной работе.',
    fullBio:
      'Шугыла ведет практики, которые помогают замедлиться, снять напряжение и вернуть телу мягкость. Особенно бережно работает с новичками и после нагрузки.',
    specialties: ['Инь-йога', 'Растяжка', 'Восстановление'],
  },
  {
    key: 'danagul',
    slug: 'danagul',
    name: 'Данагуль',
    photoUrl: '/uploads/masters/Данагуль.png',
    shortBio: 'Помогает новичкам уверенно освоить базу и почувствовать тело в практике.',
    fullBio:
      'Данагуль делает сложные элементы понятными и спокойными. На ее занятиях удобно начинать путь в йоге и постепенно укреплять тело.',
    specialties: ['Йога для начинающих', 'Базовые асаны', 'Осознанность'],
  },
  {
    key: 'maigul',
    slug: 'maigul',
    name: 'Майгуль',
    photoUrl: '/uploads/masters/maigul.svg',
    shortBio: 'Собирает сбалансированные занятия, где сила сочетается с подвижностью и дыханием.',
    fullBio:
      'Майгуль выстраивает практику так, чтобы ученики ощущали прогресс без перегрузки. Ей близок подход, в котором техника и удовольствие идут вместе.',
    specialties: ['Хатха-йога', 'Мобильность', 'Баланс'],
  },
  {
    key: 'karakoz',
    slug: 'karakoz',
    name: 'Каракоз',
    photoUrl: '/uploads/masters/karakoz.svg',
    shortBio: 'Проводит спокойные женские практики с фокусом на ресурс и внутреннее состояние.',
    fullBio:
      'Каракоз создает теплое пространство, где можно выдохнуть, восстановиться и мягко укрепить тело. Часто работает с дыханием и расслаблением.',
    specialties: ['Женская йога', 'Медитация', 'Мягкая практика'],
  },
  {
    key: 'bayan',
    slug: 'bayan',
    name: 'Баян',
    photoUrl: '/uploads/masters/bayan.svg',
    shortBio: 'Любит структурные классы и понятную подачу для тех, кому важна техника.',
    fullBio:
      'Баян ведет практики с четкой логикой построения. Ученики ценят ее за ясные объяснения, ровный ритм и внимание к качеству выполнения асан.',
    specialties: ['Хатха-йога', 'Техника асан', 'Построение практики'],
  },
  {
    key: 'gulnara',
    slug: 'gulnara',
    name: 'Гульнара',
    photoUrl: '/uploads/masters/gulnara.svg',
    shortBio: 'Ведет теплые вечерние занятия для снятия стресса и глубокой перезагрузки.',
    fullBio:
      'Гульнара помогает переключиться после насыщенного дня. Ее классы соединяют мягкое движение, дыхание и спокойную концентрацию.',
    specialties: ['Вечерняя йога', 'Антистресс', 'Релакс'],
  },
  {
    key: 'gulum',
    slug: 'gulum',
    name: 'Гулюм',
    photoUrl: '/uploads/masters/Гулюм.png',
    shortBio: 'Работает с гибкостью, раскрытием грудного отдела и аккуратным удлинением мышц.',
    fullBio:
      'Гулюм любит практики, после которых тело ощущается свободнее и легче. На занятиях много внимания безопасной растяжке и выравниванию.',
    specialties: ['Стретчинг', 'Инь-йога', 'Гибкость'],
  },
  {
    key: 'asylzhan',
    slug: 'asylzhan',
    name: 'Асылжан',
    photoUrl: '/uploads/masters/asylzhan.svg',
    shortBio: 'Проводит уверенные энергичные классы для тех, кто любит активную практику.',
    fullBio:
      'Асылжан ведет бодрые занятия с хорошей динамикой и дисциплиной. Подходит ученикам, которым нравится ощутимая физическая работа и концентрация.',
    specialties: ['Виньяса', 'Интенсивная практика', 'Выносливость'],
  },
] as const;

const classTypesSeed = [
  {
    id: 'ct-hatha',
    titleRu: 'Хатха-йога',
    titleEn: 'Hatha Yoga',
    titleKk: 'Хатха-йога',
    descriptionRu:
      'Классическая практика, объединяющая асаны, дыхание и концентрацию. Подходит для всех уровней подготовки.',
    descriptionEn:
      'Classic practice that combines asanas, breathing, and focus. Suitable for all levels.',
    descriptionKk:
      'Асана, тыныс және зейінді біріктіретін классикалық тәжірибе. Барлық деңгейге сай.',
    durationMinutes: 90,
    level: ClassLevel.ALL_LEVELS,
  },
  {
    id: 'ct-vinyasa',
    titleRu: 'Виньяса',
    titleEn: 'Vinyasa Flow',
    titleKk: 'Виньяса',
    descriptionRu:
      'Динамичная практика, где движения синхронизированы с дыханием. Развивает силу, гибкость и концентрацию.',
    descriptionEn:
      'Dynamic practice where movement is synchronized with breath. Builds strength, flexibility, and focus.',
    descriptionKk:
      'Қозғалыс тыныспен үндесетін динамикалық тәжірибе. Күшті, икемділікті және зейінді дамытады.',
    durationMinutes: 60,
    level: ClassLevel.INTERMEDIATE,
  },
  {
    id: 'ct-yin',
    titleRu: 'Инь-йога',
    titleEn: 'Yin Yoga',
    titleKk: 'Инь-йога',
    descriptionRu:
      'Медленная глубокая практика с длительным удержанием поз. Хорошо подходит для восстановления.',
    descriptionEn:
      'Slow deep practice with long-held poses. Excellent for recovery and release.',
    descriptionKk:
      'Позалар ұзақ ұсталып орындалатын баяу терең тәжірибе. Қалпына келуге өте жақсы.',
    durationMinutes: 75,
    level: ClassLevel.ALL_LEVELS,
  },
  {
    id: 'ct-ashtanga',
    titleRu: 'Аштанга',
    titleEn: 'Ashtanga',
    titleKk: 'Аштанга',
    descriptionRu:
      'Структурированная практика для тех, кто любит последовательность, силу и дисциплину.',
    descriptionEn:
      'Structured practice for those who enjoy sequence, strength, and discipline.',
    descriptionKk:
      'Реттілік, күш және тәртіп ұнайтындар үшін құрылымды тәжірибе.',
    durationMinutes: 90,
    level: ClassLevel.ADVANCED,
  },
  {
    id: 'ct-beginners',
    titleRu: 'Йога для начинающих',
    titleEn: 'Yoga for Beginners',
    titleKk: 'Жаңадан бастаушыларға арналған йога',
    descriptionRu:
      'Мягкое знакомство с основами йоги, базовыми позами и базовым дыханием в комфортном темпе.',
    descriptionEn:
      'Gentle introduction to yoga basics, fundamental poses, and breathing at a comfortable pace.',
    descriptionKk:
      'Йоганың негізгі позалары мен тынысымен жайлы қарқында таныстыратын жұмсақ бастама.',
    durationMinutes: 60,
    level: ClassLevel.BEGINNER,
  },
] as const;

async function main() {
  console.log('Seeding Nity database...');

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nity.kz';
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123456';
  const seedUserEmail = process.env.SEED_USER_EMAIL || 'user@nity.kz';
  const seedUserPassword = process.env.SEED_USER_PASSWORD || 'user123456';

  const adminHash = await bcrypt.hash(seedAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    update: {
      passwordHash: adminHash,
      role: Role.ADMIN,
      authProvider: AuthProvider.EMAIL,
    },
    create: {
      name: 'Администратор Nity',
      email: seedAdminEmail,
      passwordHash: adminHash,
      role: Role.ADMIN,
      authProvider: AuthProvider.EMAIL,
    },
  });
  console.log(`Admin: ${admin.email}`);

  const userHash = await bcrypt.hash(seedUserPassword, 12);
  const user = await prisma.user.upsert({
    where: { email: seedUserEmail },
    update: {},
    create: {
      name: 'Айгерим Бекова',
      email: seedUserEmail,
      passwordHash: userHash,
      role: Role.USER,
      authProvider: AuthProvider.EMAIL,
    },
  });
  console.log(`User: ${user.email}`);

  const masters = await Promise.all(
    mastersSeed.map((master) =>
      prisma.yogaMaster.upsert({
        where: { slug: master.slug },
        update: {
          slug: master.slug,
          name: master.name,
          photoUrl: master.photoUrl,
          shortBio: master.shortBio,
          fullBio: master.fullBio,
          specialties: [...master.specialties],
          isActive: true,
        },
        create: {
          slug: master.slug,
          name: master.name,
          photoUrl: master.photoUrl,
          shortBio: master.shortBio,
          fullBio: master.fullBio,
          specialties: [...master.specialties],
          isActive: true,
        },
      }),
    ),
  );
  console.log(`Masters: ${masters.map((master) => master.name).join(', ')}`);

  const mastersByKey = Object.fromEntries(
    mastersSeed.map((master, index) => [master.key, masters[index]]),
  ) as Record<(typeof mastersSeed)[number]['key'], (typeof masters)[number]>;

  const classTypes = await Promise.all(
    classTypesSeed.map((classType) =>
      prisma.yogaClassType.upsert({
        where: { id: classType.id },
        update: {
          titleRu: classType.titleRu,
          titleEn: classType.titleEn,
          titleKk: classType.titleKk,
          descriptionRu: classType.descriptionRu,
          descriptionEn: classType.descriptionEn,
          descriptionKk: classType.descriptionKk,
          durationMinutes: classType.durationMinutes,
          level: classType.level,
          isActive: true,
        },
        create: {
          ...classType,
          isActive: true,
        },
      }),
    ),
  );
  console.log(`Class types: ${classTypes.map((classType) => classType.titleRu).join(', ')}`);

  const classTypesById = Object.fromEntries(
    classTypes.map((classType) => [classType.id, classType]),
  ) as Record<(typeof classTypesSeed)[number]['id'], (typeof classTypes)[number]>;

  const scheduleSeed = [
    {
      id: 'slot-mon-1',
      masterKey: 'akmaral',
      classTypeId: 'ct-hatha',
      weekday: Weekday.MONDAY,
      startTime: '08:00',
      endTime: '09:30',
      capacity: 12,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-mon-2',
      masterKey: 'danagul',
      classTypeId: 'ct-beginners',
      weekday: Weekday.MONDAY,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 15,
      locationLabel: 'Зал 2',
    },
    {
      id: 'slot-tue-1',
      masterKey: 'zhanara',
      classTypeId: 'ct-vinyasa',
      weekday: Weekday.TUESDAY,
      startTime: '07:30',
      endTime: '08:30',
      capacity: 10,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-tue-2',
      masterKey: 'shugyla',
      classTypeId: 'ct-yin',
      weekday: Weekday.TUESDAY,
      startTime: '19:30',
      endTime: '20:45',
      capacity: 12,
      locationLabel: 'Зал 2',
    },
    {
      id: 'slot-wed-1',
      masterKey: 'asylzhan',
      classTypeId: 'ct-ashtanga',
      weekday: Weekday.WEDNESDAY,
      startTime: '07:00',
      endTime: '08:30',
      capacity: 8,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-wed-2',
      masterKey: 'karakoz',
      classTypeId: 'ct-yin',
      weekday: Weekday.WEDNESDAY,
      startTime: '18:00',
      endTime: '19:15',
      capacity: 12,
      locationLabel: 'Зал 2',
    },
    {
      id: 'slot-thu-1',
      masterKey: 'maigul',
      classTypeId: 'ct-hatha',
      weekday: Weekday.THURSDAY,
      startTime: '08:00',
      endTime: '09:30',
      capacity: 12,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-thu-2',
      masterKey: 'bayan',
      classTypeId: 'ct-vinyasa',
      weekday: Weekday.THURSDAY,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 10,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-fri-1',
      masterKey: 'gulnara',
      classTypeId: 'ct-beginners',
      weekday: Weekday.FRIDAY,
      startTime: '09:00',
      endTime: '10:00',
      capacity: 15,
      locationLabel: 'Зал 2',
    },
    {
      id: 'slot-fri-2',
      masterKey: 'gulum',
      classTypeId: 'ct-yin',
      weekday: Weekday.FRIDAY,
      startTime: '19:00',
      endTime: '20:15',
      capacity: 12,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-sat-1',
      masterKey: 'asylzhan',
      classTypeId: 'ct-ashtanga',
      weekday: Weekday.SATURDAY,
      startTime: '10:00',
      endTime: '11:30',
      capacity: 8,
      locationLabel: 'Зал 1',
    },
    {
      id: 'slot-sat-2',
      masterKey: 'akmaral',
      classTypeId: 'ct-hatha',
      weekday: Weekday.SATURDAY,
      startTime: '12:00',
      endTime: '13:30',
      capacity: 15,
      locationLabel: 'Зал 2',
    },
    {
      id: 'slot-sun-1',
      masterKey: 'zhanara',
      classTypeId: 'ct-vinyasa',
      weekday: Weekday.SUNDAY,
      startTime: '11:00',
      endTime: '12:30',
      capacity: 12,
      locationLabel: 'Зал 1',
    },
  ] as const;

  const slots = await Promise.all(
    scheduleSeed.map((slot) =>
      prisma.scheduleSlot.upsert({
        where: { id: slot.id },
        update: {
          masterId: mastersByKey[slot.masterKey].id,
          classTypeId: classTypesById[slot.classTypeId].id,
          weekday: slot.weekday,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          locationLabel: slot.locationLabel,
          isActive: true,
        },
        create: {
          id: slot.id,
          masterId: mastersByKey[slot.masterKey].id,
          classTypeId: classTypesById[slot.classTypeId].id,
          weekday: slot.weekday,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          locationLabel: slot.locationLabel,
          isActive: true,
        },
      }),
    ),
  );
  console.log(`Schedule slots: ${slots.length}`);
  console.log('Existing bookings and admin-created schedule entries were preserved.');

  console.log('Seed complete');
  console.log(`Admin: ${seedAdminEmail} / ${seedAdminPassword}`);
  console.log(`User:  ${seedUserEmail} / ${seedUserPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
