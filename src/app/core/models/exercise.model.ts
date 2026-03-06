// ExerciseDB API (exercisedb.dev) — modèle de données réel
export interface Exercise {
  exerciseId: string;         // ex: "VPPtusI" (alphanumérique)
  name: string;
  nameFr?: string;
  bodyParts: string[];        // ex: ["back"], ["chest"]
  equipments: string[];       // ex: ["barbell", "body weight"]
  targetMuscles: string[];    // muscles principaux ciblés
  gifUrl: string;             // URL du GIF animé
  secondaryMuscles: string[];
  instructions: string[];
}
