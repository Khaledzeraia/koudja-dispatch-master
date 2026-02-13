import { Person, Rank, Platoon } from './types';

const FIRST_NAMES = [
  'أحمد', 'محمد', 'يوسف', 'خالد', 'عمر', 'إبراهيم', 'عبد الرحمن', 'فؤاد',
  'نبيل', 'رضا', 'سمير', 'جمال', 'حسين', 'مراد', 'بلال', 'ياسين',
  'أمين', 'كريم', 'هشام', 'طارق', 'عادل', 'صالح', 'منير', 'وليد',
  'فيصل', 'نور الدين', 'عبد الله', 'مصطفى', 'رياض', 'زكرياء', 'حمزة', 'أيوب',
  'أنيس', 'عماد', 'سفيان', 'لطفي', 'رابح', 'حكيم', 'عبد القادر', 'توفيق',
  'بوعلام', 'جلال', 'فاروق', 'مهدي', 'رفيق', 'عزيز', 'رشيد', 'ناصر',
  'لخضر', 'بشير', 'محفوظ', 'يزيد', 'فتحي', 'صبري', 'سليم', 'حبيب',
  'نذير', 'شكري', 'إسماعيل', 'عثمان', 'علي', 'سعيد', 'عبد الحق', 'مروان',
  'رمضان', 'جابر',
];

const LAST_NAMES = [
  'بن علي', 'بوزيد', 'حمادي', 'مرابط', 'بن ناصر', 'زيتوني', 'قاسمي', 'بلقاسم',
  'حداد', 'بوعلام', 'بن يوسف', 'خليفي', 'سعيداني', 'بن عمر', 'دراجي', 'بوشامة',
  'عمراني', 'مزياني', 'بوجلال', 'بركاني', 'غربي', 'شريف', 'بن صالح', 'عبد السلام',
  'طالبي', 'بوقرة', 'بن حمو', 'مقراني', 'بن شيخ', 'لعرابي', 'حميدي', 'بوطالب',
  'زروقي', 'بن داود', 'خالدي', 'رحماني', 'بن سعيد', 'بختي', 'ميلود', 'بوراس',
  'حمداني', 'بلحاج', 'كربوش', 'لعيدي', 'جباري', 'بلهادف', 'ملياني', 'بن خدة',
  'تواتي', 'مرزوقي', 'سلامي', 'بوزقاق', 'عبادة', 'بوقندورة', 'بن عيسى', 'مختاري',
  'بلخير', 'بوكلوة', 'قدور', 'حساين', 'بوعريريج', 'بلعباس', 'يحياوي', 'ثابتي',
  'عبدلي', 'بلعيد',
];

const STRUCTURE: { rank: Rank; count: number }[] = [
  { rank: 'lieutenant', count: 1 },
  { rank: 'sergeant', count: 3 },
  { rank: 'corporal', count: 5 },
  { rank: 'heavyDriver', count: 3 },
  { rank: 'lightDriver', count: 5 },
  { rank: 'agent', count: 8 },
];

export function getDefaultPersonnel(): Person[] {
  const personnel: Person[] = [];
  const platoons: Platoon[] = ['A', 'B', 'C'];
  let nameIdx = 0;

  for (const platoon of platoons) {
    let priority = 0;
    for (const { rank, count } of STRUCTURE) {
      for (let i = 0; i < count; i++) {
        const fn = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
        const ln = LAST_NAMES[nameIdx % LAST_NAMES.length];
        personnel.push({
          id: `${platoon}-${rank}-${i}`,
          name: `${fn} ${ln}`,
          rank,
          platoon,
          isPresent: true,
          priority: priority++,
        });
        nameIdx++;
      }
    }
  }

  return personnel;
}
