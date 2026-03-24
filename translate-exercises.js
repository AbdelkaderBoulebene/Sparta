#!/usr/bin/env node
/**
 * Traduction des noms d'exercices EN → FR avec terminologie officielle fitness.
 * Les patterns sont triés automatiquement par longueur décroissante pour garantir
 * que les phrases composées ("bench press") sont traitées avant les mots seuls ("press").
 */
const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, 'src', 'assets', 'exercises.json');

// ─── Dictionnaire terminologique FITNESS (EN → FR officiel) ──────────────────
const RAW_PHRASES = [
  // ── Développés / Press ───────────────────────────────────────────────────────
  ['incline bench press',             'développé incliné'],
  ['decline bench press',             'développé décliné'],
  ['close grip bench press',          'développé couché prise serrée'],
  ['narrow grip bench press',         'développé couché prise serrée'],
  ['bench press',                     'développé couché'],
  ['overhead press',                  'développé militaire'],
  ['shoulder press',                  'développé épaules'],
  ['military press',                  'développé militaire'],
  ['chest press',                     'développé pectoraux'],
  ['floor press',                     'développé sol'],
  ['skull crusher',                   'barre au front'],
  ['skullcrusher',                    'barre au front'],
  ['jm bench press',                  'JM press'],
  ['jm press',                        'JM press'],

  // ── Soulevés de terre ────────────────────────────────────────────────────────
  ['romanian deadlift',               'soulevé de terre roumain'],
  ['stiff leg deadlift',              'soulevé de terre jambes tendues'],
  ['straight leg deadlift',           'soulevé de terre jambes tendues'],
  ['sumo deadlift',                   'soulevé de terre sumo'],
  ['deficit deadlift',                'soulevé de terre en déficit'],
  ['deadlift',                        'soulevé de terre'],

  // ── Squats ────────────────────────────────────────────────────────────────────
  ['front squat',                     'squat avant'],
  ['overhead squat',                  'squat bras levés'],
  ['goblet squat',                    'squat gobelet'],
  ['jump squat',                      'squat sauté'],
  ['wall squat',                      'squat contre le mur'],
  ['pistol squat',                    'squat pistollet'],
  ['split squat',                     'squat fendu'],
  ['sumo squat',                      'squat sumo'],
  ['squat',                           'squat'],

  // ── Tractions / Tirages verticaux ────────────────────────────────────────────
  ['handstand push up',               'développé sur les mains'],
  ['handstand push-up',               'développé sur les mains'],
  ['handstand',                       'équilibre sur les mains'],
  ['chin ups',                        'tractions supination'],
  ['chin up',                         'traction supination'],
  ['chin-up',                         'traction supination'],
  ['pull ups',                        'tractions'],
  ['pull up',                         'traction'],
  ['pull-up',                         'traction'],
  ['pullup',                          'traction'],
  ['lat pulldown',                    'tirage vertical grand dorsal'],
  ['lat pull down',                   'tirage vertical grand dorsal'],
  ['pull down',                       'tirage vertical'],
  ['pulldown',                        'tirage vertical'],
  ['pull-down',                       'tirage vertical'],
  ['pull through',                    'tirage entre-jambes'],

  // ── Pompes ────────────────────────────────────────────────────────────────────
  ['push up',                         'pompe'],
  ['push-up',                         'pompe'],
  ['pushup',                          'pompe'],
  ['push down',                       'pushdown triceps'],
  ['pushdown',                        'pushdown triceps'],

  // ── Élévations ───────────────────────────────────────────────────────────────
  ['lateral raise',                   'élévation latérale'],
  ['front raise',                     'élévation frontale'],
  ['rear delt raise',                 'élévation deltoïde postérieur'],
  ['calf raise',                      'élévation des mollets'],
  ['leg raise',                       'levée de jambes'],
  ['leg lift',                        'levée de jambes'],
  ['hip raise',                       'relevé de hanche'],
  ['knee raise',                      'relevé de genoux'],

  // ── Écartés ───────────────────────────────────────────────────────────────────
  ['reverse fly',                     'écarté inversé'],
  ['chest fly',                       'écarté pectoraux'],
  ['cable fly',                       'écarté poulie'],
  ['rear delt fly',                   'écarté deltoïde postérieur'],
  ['rear fly',                        'écarté arrière'],
  ['pec fly',                         'écarté pectoraux'],

  // ── Rowing / Tirages horizontaux ─────────────────────────────────────────────
  ['renegade row',                    'rowing renégat'],
  ['inverted row',                    'tirage inversé'],
  ['bent over row',                   'rowing penché'],
  ['bent-over row',                   'rowing penché'],
  ['pendlay row',                     'rowing Pendlay'],
  ['seated row',                      'rowing assis'],
  ['cable row',                       'rowing poulie'],
  ['t-bar row',                       'rowing barre T'],
  ['t bar row',                       'rowing barre T'],
  ['upright row',                     'tirage vertical menton'],
  ['face pull',                       'tirage poulie visage'],
  ['high pull',                       'tirage haut'],
  ['lat pull',                        'tirage grand dorsal'],

  // ── Hanches / Fessiers ───────────────────────────────────────────────────────
  ['hip thrust',                      'hip thrust'],
  ['hip hinge',                       'charnière de hanche'],
  ['hip abduction',                   'abduction de hanche'],
  ['hip adduction',                   'adduction de hanche'],
  ['hip extension',                   'extension de hanche'],
  ['hip flexion',                     'flexion de hanche'],
  ['glute bridge',                    'pont fessier'],
  ['glute kickback',                  'kickback fessier'],

  // ── Machines jambes ───────────────────────────────────────────────────────────
  ['leg press',                       'presse à cuisses'],
  ['leg extension',                   'extension des jambes'],
  ['leg curl',                        'curl des jambes'],

  // ── Curls ─────────────────────────────────────────────────────────────────────
  ['hammer curl',                     'curl marteau'],
  ['concentration curl',              'curl concentration'],
  ['preacher curl',                   'curl pupitre'],
  ['spider curl',                     'curl araignée'],
  ['reverse curl',                    'curl prise inversée'],
  ['zottman curl',                    'curl Zottman'],
  ['bicep curl',                      'curl biceps'],
  ['biceps curl',                     'curl biceps'],
  ['wrist curl',                      'curl du poignet'],

  // ── Extensions triceps ───────────────────────────────────────────────────────
  ['tricep extension',                'extension triceps'],
  ['triceps extension',               'extension triceps'],
  ['tricep dip',                      'dips triceps'],
  ['triceps dip',                     'dips triceps'],
  ['chest dip',                       'dips pectoraux'],

  // ── Core / Abdominaux ────────────────────────────────────────────────────────
  ['russian twist',                   'rotation russe'],
  ['mountain climber',                'grimpeur'],
  ['dead bug',                        'dead bug'],
  ['bird dog',                        'bird dog'],
  ['sit up',                          'relevé de buste'],
  ['sit-up',                          'relevé de buste'],
  ['ab crunch',                       'crunch abdominaux'],
  ['ab wheel',                        'roue abdominale'],
  ['ab roller',                       'roue abdominale'],
  ['side plank',                      'gainage latéral'],
  ['plank',                           'gainage'],

  // ── Dos / Lombaires ───────────────────────────────────────────────────────────
  ['back extension',                  'extension lombaires'],
  ['back lever',                      'levier arrière'],
  ['front lever',                     'levier avant'],
  ['hyperextension',                  'hyperextension'],
  ['superman',                        'superman'],
  ['good morning',                    'good morning'],

  // ── Fentes / Sauts ────────────────────────────────────────────────────────────
  ['box jump',                        'saut sur box'],
  ['broad jump',                      'saut en longueur'],
  ['jump lunge',                      'fente sautée'],
  ['walking lunge',                   'fente marchée'],
  ['reverse lunge',                   'fente arrière'],
  ['side lunge',                      'fente latérale'],
  ['curtsy lunge',                    'fente révérence'],
  ['lunge',                           'fente'],
  ['step up',                         'step up'],
  ['step-up',                         'step up'],

  // ── Haltérophilie / CrossFit ─────────────────────────────────────────────────
  ['clean and press',                 'arraché-épaulé-jeté'],
  ['clean and jerk',                  'arraché-jeté'],
  ['power clean',                     'épaulé de force'],
  ['clean',                           'arraché'],
  ['snatch',                          'arraché'],
  ['thruster',                        'thruster'],
  ['turkish get up',                  'turkish get-up'],
  ['turkish get-up',                  'turkish get-up'],
  ['windmill',                        'windmill'],
  ['swing',                           'swing'],

  // ── Poignets / Cou ────────────────────────────────────────────────────────────
  ['wrist extension',                 'extension du poignet'],
  ['wrist flexion',                   'flexion du poignet'],
  ['wrist rotation',                  'rotation du poignet'],
  ['neck flexion',                    'flexion du cou'],
  ['neck extension',                  'extension du cou'],

  // ── Calisthénique ─────────────────────────────────────────────────────────────
  ['muscle up',                       'muscle-up'],
  ['muscle-up',                       'muscle-up'],
  ['scapula push up',                 'pompe scapulaire'],
  ['scapula push-up',                 'pompe scapulaire'],
  ['scapula pull up',                 'traction scapulaire'],
  ['scapula pull-up',                 'traction scapulaire'],

  // ── Mouvements simples ────────────────────────────────────────────────────────
  ['shrug',                           'haussement d\'épaules'],
  ['kickback',                        'kickback'],
  ['crunch',                          'crunch'],
  ['dip',                             'dips'],
  ['stretch',                         'étirement'],
  ['rotation',                        'rotation'],
  ['twist',                           'rotation'],
  ['press',                           'développé'],
  ['row',                             'rowing'],
  ['raise',                           'élévation'],
  ['curl',                            'curl'],
  ['fly',                             'écarté'],
  ['extension',                       'extension'],
  ['jump',                            'saut'],

  // ── Équipements ──────────────────────────────────────────────────────────────
  ['resistance band',                 'élastique'],
  ['exercise ball',                   'ballon de gym'],
  ['stability ball',                  'ballon de stabilité'],
  ['bosu ball',                       'bosu'],
  ['medicine ball',                   'médecine ball'],
  ['ez barbell',                      'barre EZ'],
  ['ez-barbell',                      'barre EZ'],
  ['ez bar',                          'barre EZ'],
  ['ez-bar',                          'barre EZ'],
  ['barbell',                         'barre'],
  ['dumbbell',                        'haltère'],
  ['kettlebell',                      'kettlebell'],
  ['cable',                           'poulie'],
  ['band',                            'élastique'],
  ['lever',                           'machine'],
  ['smith',                           'Smith'],
  ['bodyweight',                      'poids de corps'],
  ['body weight',                     'poids de corps'],
  ['weighted',                        'lesté'],
  ['assisted',                        'assisté'],

  // ── Grip (APRÈS les patterns multi-mots contenant "grip") ────────────────────
  ['close grip',                      'prise serrée'],
  ['narrow grip',                     'prise serrée'],
  ['wide grip',                       'prise large'],
  ['reverse grip',                    'prise inversée'],
  ['neutral grip',                    'prise neutre'],
  ['parallel grip',                   'prise parallèle'],
  ['overhand grip',                   'prise en pronation'],
  ['underhand grip',                  'prise en supination'],
  ['hammer grip',                     'prise marteau'],
  ['supinated',                       'supination'],
  ['pronated',                        'pronation'],

  // ── Modificateurs de position ─────────────────────────────────────────────
  ['incline',                         'incliné'],
  ['decline',                         'décliné'],
  ['standing',                        'debout'],
  ['seated',                          'assis'],
  ['lying',                           'allongé'],
  ['kneeling',                        'à genoux'],
  ['elevated',                        'surélevé'],
  ['suspended',                       'suspendu'],
  ['inverted',                        'inversé'],
  ['prone',                           'ventral'],
  ['supine',                          'dorsal'],

  // ── Modificateurs de mouvement ────────────────────────────────────────────
  ['alternating',                     'alterné'],
  ['alternate',                       'alterné'],
  ['unilateral',                      'unilatéral'],
  ['single leg',                      'une jambe'],
  ['single arm',                      'un bras'],
  ['one arm',                         'un bras'],
  ['one leg',                         'une jambe'],
  ['two arm',                         'deux bras'],
  ['both arm',                        'deux bras'],
  ['overhead',                        'bras levés'],
  ['bent over',                       'penché en avant'],
  ['bent-over',                       'penché en avant'],
  ['sumo',                            'sumo'],
  ['bulgarian',                       'bulgare'],
  ['romanian',                        'roumain'],
  ['hammer',                          'marteau'],
  ['reverse',                         'inversé'],
  ['lateral',                         'latéral'],
  ['crossover',                       'croisé'],

  // ── Position anatomique ───────────────────────────────────────────────────
  ['upper',                           'haut'],
  ['lower',                           'bas'],
  ['inner',                           'intérieur'],
  ['outer',                           'extérieur'],
  ['rear',                            'arrière'],
  ['front',                           'avant'],
  ['side',                            'latéral'],
  ['high',                            'haut'],
  ['low',                             'bas'],

  // ── Accessoires ───────────────────────────────────────────────────────────
  ['parallel bars',                   'barres parallèles'],
  ['rope',                            'corde'],
  ['v-bar',                           'barre V'],
  ['v bar',                           'barre V'],
  ['rings',                           'anneaux'],
  ['bench',                           'banc'],
  ['box',                             'box'],
  ['wall',                            'mur'],
  ['floor',                           'sol'],
  ['bar',                             'barre'],
  ['rack',                            'rack'],
  ['towel',                           'serviette'],
  ['straps',                          'sangles'],
  ['strap',                           'sangle'],
  ['machine',                         'machine'],

  // ── Divers ────────────────────────────────────────────────────────────────
  ['renegade',                        'renégat'],
  ['archer',                          'archer'],
  ['pike',                            'pike'],
  ['tuck',                            'groupé'],
  ['l-sit',                           'l-sit'],
  ['advanced',                        'avancé'],
  ['intermediate',                    'intermédiaire'],
  ['beginner',                        'débutant'],
  ['partial',                         'partiel'],
  ['full',                            'complet'],
];

// Tri automatique : patterns les plus longs en premier → évite les remplacements partiels
const PHRASES = RAW_PHRASES.sort((a, b) => b[0].length - a[0].length);

function translateExerciseName(name) {
  // Normalise : tirets et underscores → espaces pour simplifier le matching
  let result = name.toLowerCase().trim().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

  for (const [en, fr] of PHRASES) {
    // Escaper les caractères regex spéciaux
    const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Espace dans le pattern → accepte espace ou tiret
    const flexSpaces = escaped.replace(/ /g, '[\\s\\-]+');
    const regex = new RegExp('(?<![\\w])' + flexSpaces + '(?![\\w])', 'gi');
    result = result.replace(regex, fr);
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}

function main() {
  console.log('=== Traduction des exercices EN → FR (dictionnaire terminologique) ===\n');

  const exercises = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    exercises[i] = { ...ex, nameFr: translateExerciseName(ex.name) };
    if ((i + 1) % 200 === 0) process.stdout.write(`  ${i + 1}/1500...\n`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(exercises));
  const sizeKB = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`\n=== Done! 1500 exercices traduits. JSON: ${sizeKB} KB ===\n`);

  // Exemples variés
  const keywords = ['bench press', 'deadlift', 'squat', 'row', 'pull-up', 'lunge', 'curl', 'dip', 'shrug', 'fly'];
  console.log('Exemples :');
  for (const kw of keywords) {
    const s = exercises.find(ex => ex.name.toLowerCase().includes(kw));
    if (s) console.log(`  "${s.name}" → "${s.nameFr}"`);
  }
}

main();
