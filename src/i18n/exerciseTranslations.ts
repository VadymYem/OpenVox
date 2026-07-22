import type { Language } from '../types';
import type { TrainingExerciseDefinition } from '../core/training/trainingLibrary';

type ExerciseCopy = { name?: string; description: string; instruction: string; focus: string[] };

const uk: Record<string, ExerciseCopy> = {
  'lip-trill-5tone': {
    description: 'М’який п’ятинотний розігрів у комфортному діапазоні.',
    instruction:
      'Зберігай рівний потік повітря й вільні губи. Зупиняйся до того, як почнеш тиснути на верхні або нижні ноти.',
    focus: ['розігрів', 'потік повітря', 'регістрова координація']
  },
  'ng-siren': {
    description: 'Плавне глісандо для відчуття резонансу та з’єднання регістрів.',
    instruction: 'Використовуй легке «нг» і ковзай без форсування гучності.',
    focus: ['резонанс', 'перехід між регістрами', 'плавність']
  },
  'straw-flow': {
    description: 'Легкий патерн для м’якого початку звуку та стабільного потоку повітря.',
    instruction:
      'За можливості використовуй трубочку або lip trill. Зберігай відчуття легкості й зупинися, якщо виникає дискомфорт.',
    focus: ['м’яка атака', 'потік повітря', 'розігрів']
  },
  'major-scale-legato': {
    description: 'Однооктавна гама для інтонації та зв’язаного ведення фрази.',
    instruction: 'Точно потрапляй у кожну ноту без під’їздів. Зберігай стабільну голосну.',
    focus: ['інтонація', 'legato', 'гама']
  },
  'major-arpeggio': {
    description: 'Тренування цілей основний тон–терція–квінта–октава.',
    instruction: 'Почуй наступну ноту внутрішньо ще до того, як її заспіваєш.',
    focus: ['інтервали', 'інтонація', 'опора']
  },
  'minor-arpeggio': {
    description: 'Налаштування мінорного тризвуку та октави.',
    instruction: 'Тримай мінорну терцію точною й не занижуй низхідну лінію.',
    focus: ['мінорна тональність', 'інтонація']
  },
  'chromatic-5': {
    description: 'Компактний хроматичний патерн для точності висоти.',
    instruction: 'Співай легко й ритмічно рівно. Підвищуй темп лише після чистих повторень.',
    focus: ['рухливість', 'хроматична інтонація', 'чіткість']
  },
  'rossini-scale': {
    description: 'Швидка висхідна й низхідна мажорна гама для вокальної рухливості.',
    instruction: 'Використовуй малі й ефективні рухи та не збільшуй напруження щелепи.',
    focus: ['рухливість', 'координація', 'швидкість']
  },
  'thirds-pattern': {
    description: 'Чергові терції гами в межах октави.',
    instruction: 'Роби кожен стрибок чітко й не розмазуй перехід між цільовими нотами.',
    focus: ['рухливість', 'терції', 'інтонація']
  },
  'fifth-jumps': {
    description: 'Повторювані квінти для точності інтервалів.',
    instruction: 'Підготуй верхню ноту внутрішньо до стрибка й зберігай чистий початок звуку.',
    focus: ['інтервали', 'атака', 'точність']
  },
  'octave-jumps': {
    description: 'Октавні цілі через регістрові переходи.',
    instruction: 'Використовуй помірну гучність і не перенось зайву вагу голосу вгору.',
    focus: ['октави', 'баланс регістрів', 'точність']
  },
  'messa-di-voce-lite': {
    description: 'Утримуй комфортну ноту, поступово збільшуючи та зменшуючи інтенсивність.',
    instruction: 'Зберігай центр висоти під час зміни гучності. Не форсуй максимальний звук.',
    focus: ['динаміка', 'стабільність', 'контроль дихання']
  },
  'long-tone-stability': {
    description: 'Довгі ноти для центрування та стабільності.',
    instruction: 'Шукай стабільний центр, а не намагайся наздогнати кожен дрібний рух тюнера.',
    focus: ['стабільність', 'утримання', 'інтонація']
  },
  'vibrato-observation': {
    description: 'Утримуй комфортну ноту й спостерігай частоту та ширину вібрато.',
    instruction: 'Не створюй коливання штучно. Дозволь природному вібрато з’явитися без втрати комфорту.',
    focus: ['вібрато', 'стабільність', 'усвідомлення']
  },
  'breath-4-2-8': {
    description: 'Спокійний цикл вдих–затримка–видих для ритму дихання.',
    instruction: 'Залишайся розслабленим. Зупинися при запамороченні або дискомфорті.',
    focus: ['ритм дихання', 'розслаблення']
  },
  'breath-4-4-12': {
    description: 'Довший патерн контрольованого видиху.',
    instruction: 'Тримай плечі вільними й не перенапружуйся під час затримки дихання.',
    focus: ['контроль дихання', 'видих']
  },
  'fricative-sustain': {
    description: 'Рівний тривалий «с» або «ф» для контролю вихідного потоку повітря.',
    instruction: 'Прагни тихого стабільного потоку, а не максимальної тривалості будь-якою ціною.',
    focus: ['потік повітря', 'сталість', 'опора']
  },
  'vowel-chain': {
    description: 'Зв’язана послідовність [і-е-а-о-у] на стабільному нотному патерні.',
    instruction: 'Тримай щелепу вільною й не змінюй висоту разом зі зміною голосної.',
    focus: ['голосні', 'артикуляція', 'резонанс']
  },
  'consonant-agility': {
    description: 'Швидка координація приголосних і голосних на п’ятинотному патерні.',
    instruction: 'Роби приголосні чіткими, не перериваючи потік повітря.',
    focus: ['дикція', 'рухливість', 'координація']
  },
  'pitch-memory': {
    description: 'Почуй ноту, зроби коротку паузу й відтвори її.',
    instruction: 'Спочатку внутрішньо уяви звук. Перевіряй тюнер лише після спроби.',
    focus: ['внутрішній слух', 'пам’ять висоти', 'попадання в ноту']
  },
  'interval-identification': {
    description: 'Розпізнавай інтервали на слух від унісону до октави.',
    instruction: 'Перед відповіддю слухай розмір і характер інтервалу.',
    focus: ['розвиток слуху', 'інтервали']
  },
  'interval-singback': {
    description: 'Почуй початкову ноту й заданий інтервал, потім заспівай цільову висоту.',
    instruction: 'Уяви цільову ноту до початку співу.',
    focus: ['внутрішній слух', 'відтворення інтервалів', 'висота']
  },
  'steady-pulse': {
    description: 'Стабільно відстукуй регульований метрономічний пульс.',
    instruction: 'Роби рухи економними й прагни однакових проміжків між ударами.',
    focus: ['пульс', 'таймінг']
  },
  'subdivision-switch': {
    description: 'Перемикайся між чвертями, восьмими та тріолями.',
    instruction: 'Не змінюй основний пульс під час зміни субподілу.',
    focus: ['субподіл', 'таймінг', 'координація']
  },
  'syncopation-grid': {
    description: 'Тренуй входи між долями на фоні стабільного кліку.',
    instruction: 'Внутрішньо рахуй субподіл і зберігай головний пульс стабільним.',
    focus: ['синкопа', 'таймінг']
  },
  'descending-hum': {
    description: 'М’яке низхідне humming-завершення після інтенсивної практики.',
    instruction: 'Використовуй мале зусилля й зупиняйся до некомфортно низьких нот.',
    focus: ['завершення', 'звільнення', 'резонанс']
  },
  'gentle-sigh': {
    description: 'Легкі низхідні видихи-звуки для зменшення зайвого зусилля.',
    instruction: 'Роби тихо й комфортно; це не тест вокального діапазону.',
    focus: ['завершення', 'звільнення']
  }
};

const de: Record<string, ExerciseCopy> = {
  'lip-trill-5tone': {
    description: 'Sanftes Fünfton-Aufwärmen in einem bequemen Umfang.',
    instruction:
      'Halte den Luftstrom gleichmäßig und die Lippen locker. Stoppe, bevor du obere oder untere Töne erzwingst.',
    focus: ['Aufwärmen', 'Luftstrom', 'Registerkoordination']
  },
  'ng-siren': {
    description: 'Sanftes Glissando für Resonanzwahrnehmung und Registerverbindung.',
    instruction: 'Nutze ein leichtes „ng“ und gleite ohne Lautstärke zu erzwingen.',
    focus: ['Resonanz', 'Registerübergang', 'Geschmeidigkeit']
  },
  'straw-flow': {
    description: 'Leichtes Muster für einen mühelosen Einsatz und gleichmäßigen Luftstrom.',
    instruction:
      'Nutze wenn möglich einen Strohhalm oder Lippentriller. Halte die Empfindung leicht und stoppe bei Unbehagen.',
    focus: ['leichter Einsatz', 'Luftstrom', 'Aufwärmen']
  },
  'major-scale-legato': {
    description: 'Einoctavige Tonleiter für Intonation und gebundene Phrasierung.',
    instruction: 'Triff jeden Ton sauber ohne Hineingleiten und halte den Vokal stabil.',
    focus: ['Intonation', 'Legato', 'Tonleiter']
  },
  'major-arpeggio': {
    description: 'Grundton–Terz–Quinte–Oktave als Zieltraining.',
    instruction: 'Höre den nächsten Ton innerlich, bevor du ihn singst.',
    focus: ['Intervalle', 'Intonation', 'Stütze']
  },
  'minor-arpeggio': {
    description: 'Intonation von Moll-Dreiklang und Oktave.',
    instruction: 'Zentriere die kleine Terz und lass die absteigende Linie nicht absinken.',
    focus: ['Moll-Tonalität', 'Intonation']
  },
  'chromatic-5': {
    description: 'Kompaktes chromatisches Muster für Tonhöhengenauigkeit.',
    instruction: 'Bleibe leicht und rhythmisch gleichmäßig. Erhöhe das Tempo erst nach sauberen Wiederholungen.',
    focus: ['Beweglichkeit', 'chromatische Intonation', 'Klarheit']
  },
  'rossini-scale': {
    description: 'Schnelle auf- und absteigende Dur-Tonleiter für Beweglichkeit.',
    instruction: 'Nutze kleine effiziente Bewegungen und erhöhe nicht die Kieferspannung.',
    focus: ['Beweglichkeit', 'Koordination', 'Tempo']
  },
  'thirds-pattern': {
    description: 'Abwechselnde Tonleiterterzen über eine Oktave.',
    instruction: 'Halte jeden Sprung sauber und verschmiere nicht zwischen den Zielnoten.',
    focus: ['Beweglichkeit', 'Terzen', 'Intonation']
  },
  'fifth-jumps': {
    description: 'Wiederholte Quinten für Intervallgenauigkeit.',
    instruction: 'Bereite den oberen Ton innerlich vor und halte den Einsatz sauber.',
    focus: ['Intervalle', 'Einsatz', 'Genauigkeit']
  },
  'octave-jumps': {
    description: 'Oktavziele über Registerübergänge hinweg.',
    instruction: 'Nutze moderate Lautstärke und trage nicht unnötig Gewicht nach oben.',
    focus: ['Oktaven', 'Registerbalance', 'Genauigkeit']
  },
  'messa-di-voce-lite': {
    description: 'Halte einen bequemen Ton und steigere sowie reduziere die Intensität allmählich.',
    instruction: 'Halte das Tonzentrum bei Lautstärkeänderung stabil und erzwinge keine Maximallautstärke.',
    focus: ['Dynamik', 'Stabilität', 'Atemkontrolle']
  },
  'long-tone-stability': {
    description: 'Haltetöne für Zentrierung und Ruhe.',
    instruction: 'Suche eine stabile Mitte, statt jeder kleinen Tunerbewegung hinterherzujagen.',
    focus: ['Stabilität', 'Halten', 'Intonation']
  },
  'vibrato-observation': {
    description: 'Halte einen bequemen Ton und beobachte Vibratorate und -breite.',
    instruction: 'Erzeuge keine künstliche Schwingung. Lass natürliches Vibrato bequem entstehen.',
    focus: ['Vibrato', 'Stabilität', 'Wahrnehmung']
  },
  'breath-4-2-8': {
    description: 'Ruhiger Einatmen–Halten–Ausatmen-Zyklus für Atemrhythmus.',
    instruction: 'Bleibe entspannt und stoppe bei Schwindel oder Unbehagen.',
    focus: ['Atemrhythmus', 'Entspannung']
  },
  'breath-4-4-12': {
    description: 'Längeres Muster für kontrollierte Ausatmung.',
    instruction: 'Halte die Schultern locker und erzwinge das Luftanhalten nicht.',
    focus: ['Atemkontrolle', 'Ausatmung']
  },
  'fricative-sustain': {
    description: 'Zeitlich gehaltenes „s“ oder „f“ für gleichmäßigen ausströmenden Luftfluss.',
    instruction: 'Suche einen ruhigen konstanten Strom statt maximale Dauer um jeden Preis.',
    focus: ['Luftstrom', 'Konstanz', 'Stütze']
  },
  'vowel-chain': {
    description: 'Gebundene Folge [i-e-a-o-u] auf einem stabilen Tonmuster.',
    instruction: 'Halte den Kiefer frei und verändere beim Vokalwechsel nicht die Tonhöhe.',
    focus: ['Vokale', 'Artikulation', 'Resonanz']
  },
  'consonant-agility': {
    description: 'Schnelle Konsonant-Vokal-Koordination über ein Fünftonmuster.',
    instruction: 'Halte die Konsonanten klar, ohne den Luftstrom zu unterbrechen.',
    focus: ['Diktion', 'Beweglichkeit', 'Koordination']
  },
  'pitch-memory': {
    description: 'Höre einen Ton, warte kurz und reproduziere ihn.',
    instruction: 'Verinnerliche den Klang vor dem Singen und prüfe den Tuner erst nach dem Versuch.',
    focus: ['Audiation', 'Tonhöhengedächtnis', 'Treffsicherheit']
  },
  'interval-identification': {
    description: 'Erkenne Intervalle vom Unisono bis zur Oktave nach Gehör.',
    instruction: 'Höre vor der Antwort auf Größe und Charakter des Intervalls.',
    focus: ['Gehörbildung', 'Intervalle']
  },
  'interval-singback': {
    description: 'Höre einen Startton und ein Zielintervall und singe anschließend den Zielton.',
    instruction: 'Stelle dir das Ziel innerlich vor, bevor du singst.',
    focus: ['Audiation', 'Intervallproduktion', 'Tonhöhe']
  },
  'steady-pulse': {
    description: 'Tippe gleichmäßig zu einem einstellbaren Metronom.',
    instruction: 'Halte Bewegungen sparsam und strebe gleiche Abstände zwischen den Taps an.',
    focus: ['Puls', 'Timing']
  },
  'subdivision-switch': {
    description: 'Wechsle zwischen Vierteln, Achteln und Triolen.',
    instruction: 'Halte den Grundschlag unverändert, während die Unterteilung wechselt.',
    focus: ['Unterteilung', 'Timing', 'Koordination']
  },
  'syncopation-grid': {
    description: 'Übe Offbeat-Einsätze gegen einen stabilen Klick.',
    instruction: 'Zähle Unterteilungen innerlich und halte den Hauptpuls stabil.',
    focus: ['Synkope', 'Timing']
  },
  'descending-hum': {
    description: 'Sanftes absteigendes Summen nach intensiver Übung.',
    instruction: 'Nutze wenig Aufwand und stoppe vor unangenehm tiefen Tönen.',
    focus: ['Cooldown', 'Lösung', 'Resonanz']
  },
  'gentle-sigh': {
    description: 'Leichte absteigende Seufzer zum Lösen unnötiger Anstrengung.',
    instruction: 'Bleibe leise und bequem; dies ist kein Umfangstest.',
    focus: ['Cooldown', 'Lösung']
  }
};

const copies: Partial<Record<Language, Record<string, ExerciseCopy>>> = { uk, de };

export function translateExercise(
  language: Language,
  exercise: TrainingExerciseDefinition
): TrainingExerciseDefinition {
  const translated = copies[language]?.[exercise.id];
  if (!translated) return exercise;
  return {
    ...exercise,
    description: translated.description,
    instruction: translated.instruction,
    focus: translated.focus
  };
}
