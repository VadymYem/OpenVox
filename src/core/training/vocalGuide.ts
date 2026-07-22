import type { Language } from '../../types';

export type VocalGuideLesson = {
  id: string;
  title: string;
  summary: string;
  principles: string[];
  practice: string;
  caution?: string;
};

const en: VocalGuideLesson[] = [
  {
    id: 'posture',
    title: 'Alignment and freedom',
    summary: 'Efficient singing starts with a balanced body, not a rigid pose.',
    principles: [
      'Keep the head balanced over the spine rather than reaching the chin forward.',
      'Let the sternum remain comfortably buoyant while shoulders stay free.',
      'Avoid locking knees, jaw or tongue; stable support does not require whole-body tension.'
    ],
    practice:
      'Stand, shift gently in every direction, find the center, then sing an easy five-note pattern without losing that balance.'
  },
  {
    id: 'breath',
    title: 'Breath management',
    summary:
      'Singing coordinates inhalation, pressure and airflow rather than simply taking the biggest possible breath.',
    principles: [
      'Inhale silently and comfortably without raising the shoulders.',
      'Release air according to the phrase instead of pushing a constant maximum stream.',
      'Allow recovery breaths; repeated breath-holding is not a measure of vocal quality.'
    ],
    practice: 'Use short hiss or fricative patterns, then transfer the same steady flow to an easy vowel.',
    caution: 'Stop breath exercises if you feel light-headed, painful or unusually short of breath.'
  },
  {
    id: 'onset',
    title: 'Clean vocal onset',
    summary:
      'A balanced onset coordinates airflow and vocal-fold vibration without a hard attack or excessive breathiness.',
    principles: [
      'Prepare pitch and vowel before the sound begins.',
      'Aim for immediate, easy vibration rather than a delayed breathy start.',
      'Use light consonants such as m, n, v or z when direct vowel onsets feel unstable.'
    ],
    practice: 'Alternate gentle “vv–oo” and “mm–ah” on a comfortable note, keeping the start quiet and precise.'
  },
  {
    id: 'resonance',
    title: 'Resonance and vocal tract',
    summary:
      'Resonance changes when the shape of the vocal tract changes; it should be explored through sound and comfort, not forced placement.',
    principles: [
      'Keep the jaw and tongue responsive rather than fixed.',
      'Compare vowels at equal volume to notice how timbre changes.',
      'Use hums, lip trills and semi-occluded exercises as low-effort bridges into open vowels.'
    ],
    practice: 'Sing a small pattern on “ng–ah”, preserving pitch and airflow as the mouth opens.'
  },
  {
    id: 'registers',
    title: 'Registers and transitions',
    summary:
      'Register transitions are coordination changes, not single universal notes that every singer must cross in the same way.',
    principles: [
      'Reduce excess volume before difficult transitions.',
      'Let vowel and resonance strategy adapt as pitch rises.',
      'Practice through transitions gradually from both directions rather than repeatedly forcing the highest note.'
    ],
    practice:
      'Use light sirens and octave slides through a comfortable transition area, then repeat with a simple vowel.'
  },
  {
    id: 'vowels',
    title: 'Vowels and consistency',
    summary:
      'Stable vowels improve intonation, resonance and legato, while extreme mouth shapes often add unnecessary tension.',
    principles: [
      'Keep the vowel recognizable while allowing subtle modification across range.',
      'Avoid spreading the mouth simply to reach higher notes.',
      'Track pitch while changing vowels to reveal intonation shifts.'
    ],
    practice: 'Sustain one pitch through i–e–a–o–u, then repeat on a short five-note pattern.'
  },
  {
    id: 'articulation',
    title: 'Articulation without interruption',
    summary: 'Clear text should ride on the airflow instead of repeatedly stopping the phrase.',
    principles: [
      'Let consonants be precise but proportionate to the musical style.',
      'Release jaw and tongue immediately after consonant contact.',
      'Practice difficult text rhythmically before adding full melody.'
    ],
    practice: 'Speak a phrase in rhythm, then sing it on one pitch, then restore the original melody.'
  },
  {
    id: 'intonation',
    title: 'Intonation and audiation',
    summary: 'Accurate singing combines hearing the target internally with reliable vocal coordination.',
    principles: [
      'Hear the destination before large interval jumps.',
      'Use a reference tone, attempt from memory, then check the tuner after the attempt.',
      'Distinguish a consistently sharp/flat center from normal moment-to-moment movement.'
    ],
    practice:
      'Use Pitch Match and Sight Singing with the tuner hidden during the first attempt, then review the measured result.'
  },
  {
    id: 'rhythm',
    title: 'Rhythm and coordination',
    summary: 'Pitch accuracy is not enough when note placement and subdivision are unstable.',
    principles: [
      'Feel a steady underlying beat before adding faster subdivisions.',
      'Practice entrances and releases as deliberately as sustained notes.',
      'Slow difficult passages while preserving subdivision, then increase tempo gradually.'
    ],
    practice: 'Tap the pulse, speak the rhythm, sing on one pitch, then restore the melody.'
  },
  {
    id: 'dynamics',
    title: 'Dynamics and control',
    summary: 'Changing loudness while maintaining pitch requires coordinated airflow and vocal-fold behavior.',
    principles: [
      'Build intensity gradually instead of jumping directly to maximum volume.',
      'Keep the pitch center stable during crescendos and diminuendos.',
      'Use moderate dynamics for most technical practice to reduce fatigue.'
    ],
    practice: 'Sustain a comfortable pitch and perform a gentle swell from soft to medium and back to soft.'
  },
  {
    id: 'vibrato',
    title: 'Vibrato observation',
    summary:
      'Vibrato is a pitch modulation that should be observed in context rather than forced to match a single “ideal” number.',
    principles: [
      'Do not manufacture oscillation by shaking the jaw or abdomen.',
      'Compare vibrato at different comfortable dynamics.',
      'Use stability and vibrato metrics as descriptive feedback, not medical diagnosis.'
    ],
    practice: 'Record several comfortable sustained notes and compare rate and width trends across sessions.'
  },
  {
    id: 'practice-design',
    title: 'Practice design and recovery',
    summary: 'Consistent, focused practice is usually more productive than repeatedly singing until fatigue.',
    principles: [
      'Begin with easy coordination before demanding range or speed.',
      'Alternate technical challenges instead of overloading one behavior for a long block.',
      'Finish with lower-effort work and record notes about what improved or felt difficult.'
    ],
    practice:
      'Use Session Planner, keep one primary goal per session, and review Progress before choosing the next focus.',
    caution:
      'Persistent pain, loss of voice or unusual vocal symptoms should not be trained through; seek qualified clinical or voice-professional guidance when appropriate.'
  }
];

const uk: VocalGuideLesson[] = [
  {
    id: 'posture',
    title: 'Положення тіла та свобода',
    summary: 'Ефективний спів починається зі збалансованого тіла, а не з жорсткої «правильної пози».',
    principles: [
      'Тримай голову збалансованою над хребтом, не витягуй підборіддя вперед.',
      'Грудна клітка може залишатися вільно піднятою, а плечі — рухливими.',
      'Не блокуй коліна, щелепу чи язик: опора не потребує напруження всього тіла.'
    ],
    practice:
      'Постій рівно, м’яко перенеси вагу в різні боки, знайди центр і заспівай легку п’ятинотну вправу, не втрачаючи балансу.'
  },
  {
    id: 'breath',
    title: 'Керування диханням',
    summary: 'Спів координує вдих, тиск і потік повітря, а не вимагає щоразу набирати максимально можливий вдих.',
    principles: [
      'Вдихай тихо й комфортно, не піднімаючи плечі.',
      'Віддавай повітря відповідно до фрази, а не штовхай постійно максимальний потік.',
      'Дозволяй собі відновлювальні вдихи; довге затримування дихання не є показником якості голосу.'
    ],
    practice: 'Потренуй рівний видих на «с» або «ф», а потім перенеси той самий потік на легку голосну.',
    caution: 'Зупини дихальну вправу, якщо з’являється запаморочення, біль або незвична задишка.'
  },
  {
    id: 'onset',
    title: 'Чистий початок звуку',
    summary: 'Збалансована атака координує повітря й вібрацію без жорсткого удару та без надмірно придихового старту.',
    principles: [
      'Підготуй висоту й голосну ще до початку звуку.',
      'Шукай одразу легку вібрацію, а не запізнілий придиховий вступ.',
      'Якщо пряма атака голосної нестабільна, використовуй легкі м, н, в або з.'
    ],
    practice: 'Чередуй м’які «вв–у» та «мм–а» на комфортній ноті, зберігаючи тихий і точний початок.'
  },
  {
    id: 'resonance',
    title: 'Резонанс і вокальний тракт',
    summary:
      'Резонанс змінюється разом із формою вокального тракту; його краще досліджувати через звук і комфорт, а не силове «розміщення».',
    principles: [
      'Залишай щелепу й язик рухливими.',
      'Порівнюй голосні на однаковій гучності й слухай зміну тембру.',
      'Використовуй humming, lip trill та напівзакриті вправи як легкий перехід до відкритих голосних.'
    ],
    practice: 'Заспівай невеликий патерн на «нг–а», зберігаючи висоту й потік повітря під час відкривання рота.'
  },
  {
    id: 'registers',
    title: 'Регістри та переходи',
    summary: 'Регістрові переходи — це зміни координації, а не одна універсальна нота, однакова для всіх співаків.',
    principles: [
      'Перед складним переходом зменшуй зайву гучність.',
      'Дозволяй голосній і резонансній стратегії адаптуватися з висотою.',
      'Проходь зону переходу поступово в обох напрямках, а не штурмуй одну найвищу ноту.'
    ],
    practice: 'Роби легкі сирени й октавні ковзання через комфортну зону переходу, потім повторюй на простій голосній.'
  },
  {
    id: 'vowels',
    title: 'Голосні та стабільність',
    summary:
      'Стабільні голосні допомагають інтонації, резонансу й legato, тоді як надмірні форми рота часто додають напруження.',
    principles: [
      'Зберігай впізнаваність голосної, дозволяючи невелику адаптацію у різних регістрах.',
      'Не розтягуй рот лише заради високих нот.',
      'Контролюй висоту під час зміни голосних, щоб помічати інтонаційні зсуви.'
    ],
    practice: 'Тримай одну ноту на і–е–а–о–у, потім повтори послідовність на короткому п’ятинотному патерні.'
  },
  {
    id: 'articulation',
    title: 'Артикуляція без розриву фрази',
    summary: 'Чіткий текст має рухатися разом із потоком повітря, а не постійно зупиняти музичну фразу.',
    principles: [
      'Роби приголосні точними, але пропорційними стилю.',
      'Одразу після контакту приголосної звільняй щелепу й язик.',
      'Складний текст спочатку відпрацьовуй ритмічно, а вже потім додавай мелодію.'
    ],
    practice: 'Промов фразу в ритмі, потім заспівай її на одній ноті й лише після цього поверни оригінальну мелодію.'
  },
  {
    id: 'intonation',
    title: 'Інтонація та внутрішній слух',
    summary: 'Точний спів поєднує внутрішнє уявлення цільового звуку з надійною вокальною координацією.',
    principles: [
      'Перед великим стрибком спочатку почуй ціль усередині.',
      'Прослухай еталон, спробуй відтворити з пам’яті й лише потім перевір тюнер.',
      'Відрізняй систематично завищений або занижений центр від природного мікроруху висоти.'
    ],
    practice:
      'Використовуй Pitch Match і Sight Singing: першу спробу зроби без підглядання в тюнер, потім проаналізуй результат.'
  },
  {
    id: 'rhythm',
    title: 'Ритм і координація',
    summary: 'Точна висота не рятує фразу, якщо нестабільні входи, тривалості й субподіл.',
    principles: [
      'Спочатку відчуй рівний пульс, потім додавай дрібніші поділи.',
      'Тренуй входи та завершення ноти так само свідомо, як її утримання.',
      'Сповільнюй складні місця, не втрачаючи внутрішнього поділу, і прискорюй поступово.'
    ],
    practice: 'Відстукай пульс, промов ритм, заспівай його на одній висоті, а потім поверни мелодію.'
  },
  {
    id: 'dynamics',
    title: 'Динаміка та контроль',
    summary: 'Зміна гучності при стабільній висоті вимагає узгодженої роботи потоку повітря й голосоутворення.',
    principles: [
      'Нарощуй інтенсивність поступово, а не стрибай одразу в максимум.',
      'Стеж за центром ноти під час crescendo й diminuendo.',
      'Більшість технічної роботи виконуй у помірній динаміці, щоб зменшити втому.'
    ],
    practice: 'На комфортній ноті зроби м’яке збільшення від тихого до середнього звуку й повернися назад.'
  },
  {
    id: 'vibrato',
    title: 'Спостереження за вібрато',
    summary:
      'Вібрато — це модуляція висоти, яку варто спостерігати в контексті, а не силоміць підганяти під одне «ідеальне» число.',
    principles: [
      'Не створюй коливання трясінням щелепи або живота.',
      'Порівнюй вібрато на різних комфортних рівнях гучності.',
      'Сприймай метрики стабільності та вібрато як описовий зворотний зв’язок, а не медичний діагноз.'
    ],
    practice: 'Запиши кілька комфортних довгих нот і порівнюй тенденції частоти та ширини вібрато між сесіями.'
  },
  {
    id: 'practice-design',
    title: 'Побудова занять і відновлення',
    summary: 'Регулярна сфокусована практика зазвичай продуктивніша, ніж спів до виснаження.',
    principles: [
      'Починай із легкої координації перед складним діапазоном чи швидкістю.',
      'Чередуй технічні задачі, не перевантажуючи одну навичку надто довго.',
      'Завершуй менш інтенсивною роботою й записуй, що стало краще та що було складним.'
    ],
    practice:
      'Використовуй планувальник сесії, обирай одну головну мету й переглядай Progress перед наступним заняттям.',
    caution:
      'Стійкий біль, втрата голосу або незвичні симптоми не слід «перетреновувати»; за потреби звертайся до кваліфікованого лікаря або фахівця з голосу.'
  }
];

const de: VocalGuideLesson[] = [
  {
    id: 'posture',
    title: 'Ausrichtung und Freiheit',
    summary: 'Effizientes Singen beginnt mit einem ausbalancierten Körper, nicht mit einer starren Haltung.',
    principles: [
      'Halte den Kopf über der Wirbelsäule ausbalanciert, statt das Kinn nach vorn zu schieben.',
      'Lass den Brustkorb angenehm aufgerichtet und die Schultern frei.',
      'Blockiere weder Knie, Kiefer noch Zunge; Stütze braucht keine Ganzkörperspannung.'
    ],
    practice:
      'Verlagere das Gewicht sanft in alle Richtungen, finde die Mitte und singe ein leichtes Fünftonmuster ohne diese Balance zu verlieren.'
  },
  {
    id: 'breath',
    title: 'Atemmanagement',
    summary:
      'Beim Singen werden Einatmung, Druck und Luftstrom koordiniert; es geht nicht darum, immer maximal viel Luft zu nehmen.',
    principles: [
      'Atme leise und bequem ein, ohne die Schultern anzuheben.',
      'Gib Luft passend zur Phrase ab statt ständig maximal zu drücken.',
      'Erlaube Erholungsatemzüge; langes Luftanhalten ist kein Maß für Stimmqualität.'
    ],
    practice: 'Übe einen gleichmäßigen Luftstrom auf s oder f und übertrage ihn anschließend auf einen leichten Vokal.',
    caution: 'Beende Atemübungen bei Schwindel, Schmerz oder ungewöhnlicher Atemnot.'
  },
  {
    id: 'onset',
    title: 'Sauberer Stimmeinsatz',
    summary:
      'Ein ausgeglichener Einsatz koordiniert Luftstrom und Stimmlippenschwingung ohne harten Schlag oder übermäßige Hauchigkeit.',
    principles: [
      'Bereite Tonhöhe und Vokal vor dem Einsatz innerlich vor.',
      'Suche sofortige leichte Schwingung statt eines verspäteten hauchigen Starts.',
      'Nutze leichte Konsonanten wie m, n, v oder z, wenn direkte Vokaleinsätze instabil sind.'
    ],
    practice: 'Wechsle sanft zwischen „vv–u“ und „mm–a“ auf einem bequemen Ton und halte den Start leise und präzise.'
  },
  {
    id: 'resonance',
    title: 'Resonanz und Vokaltrakt',
    summary:
      'Resonanz verändert sich mit der Form des Vokaltrakts und sollte über Klang und Komfort erforscht, nicht erzwungen werden.',
    principles: [
      'Halte Kiefer und Zunge beweglich.',
      'Vergleiche Vokale bei gleicher Lautstärke und beobachte die Klangfarbe.',
      'Nutze Summen, Lippentriller und semi-okkludierte Übungen als leichte Brücke zu offenen Vokalen.'
    ],
    practice: 'Singe ein kleines Muster auf „ng–a“ und bewahre Tonhöhe und Luftstrom beim Öffnen des Mundes.'
  },
  {
    id: 'registers',
    title: 'Register und Übergänge',
    summary:
      'Registerübergänge sind Koordinationsänderungen und keine universelle Einzelnote, die für alle Stimmen gleich ist.',
    principles: [
      'Reduziere unnötige Lautstärke vor schwierigen Übergängen.',
      'Lass Vokal und Resonanzstrategie mit steigender Tonhöhe reagieren.',
      'Übe Übergänge schrittweise aus beiden Richtungen statt immer nur den höchsten Ton zu erzwingen.'
    ],
    practice:
      'Nutze leichte Sirenen und Oktavgleiter durch den bequemen Übergangsbereich und wiederhole anschließend auf einem einfachen Vokal.'
  },
  {
    id: 'vowels',
    title: 'Vokale und Konsistenz',
    summary:
      'Stabile Vokale unterstützen Intonation, Resonanz und Legato; extreme Mundformen erzeugen oft zusätzliche Spannung.',
    principles: [
      'Halte den Vokal erkennbar und erlaube kleine Anpassungen über den Umfang.',
      'Ziehe den Mund nicht nur deshalb breit, um höhere Töne zu erreichen.',
      'Beobachte die Tonhöhe beim Vokalwechsel, um Intonationsverschiebungen zu erkennen.'
    ],
    practice: 'Halte einen Ton durch i–e–a–o–u und wiederhole die Folge anschließend in einem kurzen Fünftonmuster.'
  },
  {
    id: 'articulation',
    title: 'Artikulation ohne Unterbrechung',
    summary: 'Deutlicher Text soll auf dem Luftstrom getragen werden und die musikalische Linie nicht ständig stoppen.',
    principles: [
      'Forme Konsonanten präzise, aber passend zum Stil.',
      'Löse Kiefer und Zunge unmittelbar nach dem Konsonantenkontakt.',
      'Übe schwierigen Text zuerst rhythmisch und füge danach die Melodie hinzu.'
    ],
    practice:
      'Sprich eine Phrase im Rhythmus, singe sie auf einem Ton und stelle danach die ursprüngliche Melodie wieder her.'
  },
  {
    id: 'intonation',
    title: 'Intonation und Audiation',
    summary: 'Treffsicheres Singen verbindet eine innere Vorstellung des Ziels mit zuverlässiger Stimmkoordination.',
    principles: [
      'Höre das Ziel vor einem großen Intervallsprung innerlich voraus.',
      'Höre einen Referenzton, singe aus dem Gedächtnis und prüfe erst danach den Tuner.',
      'Unterscheide eine dauerhaft zu hohe oder tiefe Mitte von normaler momentaner Tonbewegung.'
    ],
    practice:
      'Nutze Pitch Match und Sight Singing: erster Versuch ohne Blick auf den Tuner, danach die Messung auswerten.'
  },
  {
    id: 'rhythm',
    title: 'Rhythmus und Koordination',
    summary: 'Tonhöhengenauigkeit reicht nicht, wenn Einsätze, Dauern und Unterteilungen instabil sind.',
    principles: [
      'Spüre zuerst einen stabilen Grundpuls, bevor du feinere Unterteilungen hinzufügst.',
      'Übe Einsätze und Enden genauso bewusst wie gehaltene Töne.',
      'Verlangsame schwierige Stellen bei stabiler Unterteilung und erhöhe das Tempo schrittweise.'
    ],
    practice: 'Klopfe den Puls, sprich den Rhythmus, singe ihn auf einem Ton und stelle danach die Melodie wieder her.'
  },
  {
    id: 'dynamics',
    title: 'Dynamik und Kontrolle',
    summary:
      'Lautstärke zu verändern und dabei die Tonhöhe stabil zu halten verlangt koordinierte Luft- und Stimmarbeit.',
    principles: [
      'Steigere Intensität allmählich statt sofort maximal laut zu werden.',
      'Halte das Tonzentrum bei Crescendo und Diminuendo stabil.',
      'Übe technische Aufgaben überwiegend in moderater Dynamik, um Ermüdung zu reduzieren.'
    ],
    practice: 'Halte einen bequemen Ton und forme ein sanftes Anschwellen von leise zu mittel und zurück.'
  },
  {
    id: 'vibrato',
    title: 'Vibrato beobachten',
    summary:
      'Vibrato ist eine Tonhöhenmodulation, die im Kontext betrachtet und nicht auf eine einzige „Idealzahl“ gezwungen werden sollte.',
    principles: [
      'Erzeuge kein künstliches Schwingen durch Kiefer- oder Bauchbewegungen.',
      'Vergleiche Vibrato bei verschiedenen bequemen Lautstärken.',
      'Nutze Stabilitäts- und Vibratometriken als beschreibendes Feedback, nicht als medizinische Diagnose.'
    ],
    practice: 'Nimm mehrere bequeme Haltetöne auf und vergleiche Rate und Breite über mehrere Einheiten.'
  },
  {
    id: 'practice-design',
    title: 'Übungsplanung und Erholung',
    summary: 'Regelmäßiges fokussiertes Üben ist meist produktiver als Singen bis zur Erschöpfung.',
    principles: [
      'Beginne mit leichter Koordination vor anspruchsvollem Umfang oder Tempo.',
      'Wechsle technische Aufgaben, statt ein Verhalten zu lange zu überlasten.',
      'Beende mit weniger intensiver Arbeit und notiere, was besser oder schwierig war.'
    ],
    practice: 'Nutze den Session Planner, setze pro Einheit ein Hauptziel und prüfe Progress vor der nächsten Planung.',
    caution:
      'Anhaltende Schmerzen, Stimmverlust oder ungewöhnliche Symptome sollten nicht „wegtrainiert“ werden; hole bei Bedarf qualifizierte medizinische oder stimmfachliche Hilfe.'
  }
];

const guides: Record<Language, VocalGuideLesson[]> = { en, uk, de };

export function getVocalGuide(language: Language) {
  return guides[language];
}
