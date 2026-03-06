import { Injectable, signal } from '@angular/core';

const BODYPART_FR: Record<string, string> = {
  'back':        'Dos',
  'cardio':      'Cardio',
  'chest':       'Pectoraux',
  'lower arms':  'Avant-bras',
  'lower legs':  'Mollets',
  'neck':        'Cou',
  'shoulders':   'Épaules',
  'upper arms':  'Bras',
  'upper legs':  'Cuisses',
  'waist':       'Abdominaux',
};

const MUSCLE_FR: Record<string, string> = {
  // targetMuscles
  'abductors':             'Abducteurs',
  'abs':                   'Abdominaux',
  'adductors':             'Adducteurs',
  'biceps':                'Biceps',
  'calves':                'Mollets',
  'cardiovascular system': 'Système cardiovasculaire',
  'delts':                 'Deltoïdes',
  'forearms':              'Avant-bras',
  'glutes':                'Fessiers',
  'hamstrings':            'Ischio-jambiers',
  'lats':                  'Grand dorsal',
  'levator scapulae':      'Élévateur de la scapula',
  'pectorals':             'Pectoraux',
  'quads':                 'Quadriceps',
  'serratus anterior':     'Dentelé antérieur',
  'spine':                 'Rachis',
  'traps':                 'Trapèzes',
  'triceps':               'Triceps',
  'upper back':            'Haut du dos',
  // secondaryMuscles
  'abdominals':            'Abdominaux',
  'ankle stabilizers':     'Stabilisateurs de cheville',
  'ankles':                'Chevilles',
  'back':                  'Dos',
  'brachialis':            'Brachial',
  'chest':                 'Pectoraux',
  'core':                  'Gainage',
  'deltoids':              'Deltoïdes',
  'feet':                  'Pieds',
  'grip muscles':          'Muscles de préhension',
  'groin':                 'Aine',
  'hands':                 'Mains',
  'hip flexors':           'Fléchisseurs de hanche',
  'inner thighs':          'Face interne des cuisses',
  'latissimus dorsi':      'Grand dorsal',
  'lower abs':             'Bas-ventre',
  'lower back':            'Bas du dos',
  'obliques':              'Obliques',
  'quadriceps':            'Quadriceps',
  'rear deltoids':         'Deltoïdes postérieurs',
  'rhomboids':             'Rhomboïdes',
  'rotator cuff':          'Coiffe des rotateurs',
  'shins':                 'Tibias',
  'shoulders':             'Épaules',
  'soleus':                'Soléaire',
  'sternocleidomastoid':   'Sterno-cléido-mastoïdien',
  'trapezius':             'Trapèze',
  'upper chest':           'Haut des pectoraux',
  'wrist extensors':       'Extenseurs du poignet',
  'wrist flexors':         'Fléchisseurs du poignet',
  'wrists':                'Poignets',
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<'en' | 'fr'>('fr');

  toggle(): void {
    this.lang.update(l => (l === 'fr' ? 'en' : 'fr'));
  }

  translateBodyPart(en: string): string {
    return this.lang() === 'fr' ? (BODYPART_FR[en] ?? en) : en;
  }

  translateMuscle(en: string): string {
    return this.lang() === 'fr' ? (MUSCLE_FR[en] ?? en) : en;
  }
}
