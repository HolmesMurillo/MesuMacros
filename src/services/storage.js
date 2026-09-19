const STORAGE_KEY = "mesumacros:data:v1";

const defaults = {
  profile: {
    name: "",
    age: "",
    sex: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    activity: "moderate",
    goal: "maintain",
    pace: "0.25",
    units: "metric",
    language: "en",
    theme: "light",
  },
  goals: {
    calories: 2200,
    protein: 140,
    carbs: 250,
    fat: 75,
    fiber: 30,
    water: 2000,
    micronutrients: {},
  },
  foods: [],
  measurements: [],
  water: [],
  incompleteDays: [],
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}

export function loadData(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY));
    return saved
      ? {
          ...cloneDefaults(),
          ...saved,
          profile: { ...defaults.profile, ...saved.profile },
          goals: { ...defaults.goals, ...saved.goals },
        }
      : cloneDefaults();
  } catch {
    return cloneDefaults();
  }
}

export function saveData(data, userId) {
  try {
    localStorage.setItem(userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mesumacros-backup-${new Date().toLocaleDateString("en-CA")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export { defaults };
