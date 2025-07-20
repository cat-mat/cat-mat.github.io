// Tracking items configuration
export const TRACKING_ITEMS = {
  // Body Items
  energy_level: {
    id: 'energy_level',
    name: 'Energy Level',
    category: 'body',
    scale: 5,
    good: 'high',
    description: 'I\'m ready to take on the world!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Maybe tomorrow', 'Eh', 'Sure', 'Yeah!', 'Let\'s do this!'],
    faceEmojis: ['😭', '🫤', '😊', '😀', '😎'],
    heartEmojis: ['💙', '❤️', '🧡', '💛', '💚'],
    dotEmojis: ['🔵', '🔴', '🟠', '🟡', '🟢']
  },
  
  forehead_shine: {
    id: 'forehead_shine',
    name: 'Forehead Shine',
    category: 'body',
    scale: 3,
    good: 'low',
    description: 'How glossy is that forehead of yours?',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Matte', 'Satin', 'Glossy'],
    faceEmojis: ['😎', '😊', '😲'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  
  headache: {
    id: 'headache',
    name: 'Headache',
    category: 'body',
    scale: 4,
    good: 'low',
    description: 'Bleh, is that a headache?',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Nope', 'Not bad', 'Uuuugh', 'I\'m going to bed'],
    faceEmojis: ['😎', '😐', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴']
  },
  
  hot_flashes: {
    id: 'hot_flashes',
    name: 'Hot Flashes',
    category: 'body',
    scale: 4,
    good: 'low',
    description: 'Hot flashes? I\'m on fire!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m good', 'A bit warm', 'Kinda toasty', 'I AM THE SUN!'],
    faceEmojis: ['😎', '😓', '🫠', '🥵'],
    heartEmojis: ['💚', '💛', '🧡', '❤️'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴']
  },
  
  joint_pain: {
    id: 'joint_pain',
    name: 'Joint Pain',
    category: 'body',
    type: 'multi-select',
    good: 'low',
    description: 'Ugh, my joints are angry right now.',
    morning: true,
    evening: true,
    quick: true,
    options: [
      'left_shoulder',
      'right_shoulder', 
      'left_elbow',
      'right_elbow',
      'left_hip',
      'right_hip',
      'left_knee',
      'right_knee',
      'left_other',
      'right_other'
    ],
    optionLabels: {
      left_shoulder: 'Left Shoulder',
      right_shoulder: 'Right Shoulder',
      left_elbow: 'Left Elbow',
      right_elbow: 'Right Elbow',
      left_hip: 'Left Hip',
      right_hip: 'Right Hip',
      left_knee: 'Left Knee',
      right_knee: 'Right Knee',
      left_other: 'Left Other',
      right_other: 'Right Other'
    }
  },
  
  nausea: {
    id: 'nausea',
    name: 'Nausea',
    category: 'body',
    scale: 3,
    good: 'low',
    description: 'I\'m nauseous, I\'m nauseous, I\'m nauseous',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Nah, I\'m good', 'Maybe a little', 'Uh-oh...'],
    faceEmojis: ['😎', '😖', '🤢'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  
  temperature_sensitivity: {
    id: 'temperature_sensitivity',
    name: 'Temperature Sensitivity',
    category: 'body',
    scale: 3,
    good: 'low',
    description: 'Yeesh, is the A/C set to 40° right now?!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['What temperature swing?', 'Feeling normal', 'Gimme that blanket!'],
    faceEmojis: ['😎', '😳', '😰'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  
  workout_recovery: {
    id: 'workout_recovery',
    name: 'Workout Recovery',
    category: 'body',
    scale: 3,
    good: 'high',
    description: 'Yeeaahh, feeling great after that workout!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['*Grunt*', 'Doin\' ok', 'Yaaas'],
    faceEmojis: ['😖', '😬', '😎'],
    heartEmojis: ['❤️', '💛', '💚'],
    dotEmojis: ['🔴', '🟡', '🟢']
  },
  
  // Mind Items
  anxiety: {
    id: 'anxiety',
    name: 'Anxiety',
    category: 'mind',
    scale: 5,
    good: 'low',
    description: 'Yeah, no, I\'m fine. Well, actually...',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m good', 'Maybe a little anxious', 'This is normal, right?', 'I\'m freaking out', 'OMG, leave me alone!'],
    faceEmojis: ['😎', '😁', '😳', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  
  brain_fog: {
    id: 'brain_fog',
    name: 'Brain Fog',
    category: 'mind',
    scale: 3,
    good: 'low',
    description: 'I was going to do something... I came in this room for a reason...',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Clear as a bell', 'I\'ll remember it, hang on...', 'What\'s my name again?'],
    faceEmojis: ['😎', '😳', '😫'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  
  depression: {
    id: 'depression',
    name: 'Depression',
    category: 'mind',
    scale: 5,
    good: 'low',
    description: 'Feeling a little meh...',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['None', 'Minimal', 'Mild', 'Moderate', 'Severe'],
    faceEmojis: ['😎', '😁', '😳', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  
  irritability: {
    id: 'irritability',
    name: 'Irritability',
    category: 'mind',
    scale: 5,
    good: 'low',
    description: 'Argh! Why are they doing that thing again?',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m chill', 'I\'m neutral', 'I\'m a little annoyed', 'I\'m pissed', 'I\'m furious'],
    faceEmojis: ['😎', '🙂', '😕', '😠', '😡'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  
  mood: {
    id: 'mood',
    name: 'Mood',
    category: 'mind',
    scale: 3,
    good: 'high',
    description: 'I feel good, I feel great, I feel aaaaahhmazing!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Shut up', 'Yeah, not really', 'Yaaas, queen!'],
    faceEmojis: ['😡', '😐', '😎'],
    heartEmojis: ['❤️', '💛', '💚'],
    dotEmojis: ['🔴', '🟡', '🟢']
  },
  
  stress_level: {
    id: 'stress_level',
    name: 'Stress Level',
    category: 'mind',
    scale: 5,
    good: 'low',
    description: 'Yikes, I have shoulder earrings right now!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m super chill', 'Not bad', 'Meh', 'A little tense', 'OMG, leave me alone!'],
    faceEmojis: ['😎', '😁', '😳', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  
  // Morning Report Only
  sleep_feeling: {
    id: 'sleep_feeling',
    name: 'Sleep Feeling',
    category: 'body',
    scale: 3,
    good: 'high',
    description: 'Good morning, sunshine! How\'d you sleep?',
    morning: true,
    evening: false,
    quick: false,
    textOptions: ['Go away', 'Not bad', 'Like a baby'],
    faceEmojis: ['😩', '🥱', '😎'],
    heartEmojis: ['❤️', '💛', '💚'],
    dotEmojis: ['🔴', '🟡', '🟢']
  },
  
  wearables_sleep_score: {
    id: 'wearables_sleep_score',
    name: 'Wearable\'s Sleep Score',
    category: 'body',
    type: 'number',
    min: 0,
    max: 100,
    good: 'high',
    description: 'How did your wearable think you slept?',
    morning: true,
    evening: false,
    quick: false
  },
  
  wearables_body_battery: {
    id: 'wearables_body_battery',
    name: 'Wearable\'s Body Battery',
    category: 'body',
    type: 'number',
    min: 0,
    max: 100,
    good: 'high',
    description: 'How does your wearable think you\'re doing?',
    morning: true,
    evening: false,
    quick: false
  },
  
  // Evening Report Only
  overall_sentiment: {
    id: 'overall_sentiment',
    name: 'Overall Sentiment',
    category: 'mind',
    scale: 5,
    good: 'high',
    description: 'Today was a ____ day',
    morning: false,
    evening: true,
    quick: false,
    textOptions: ['Bad', 'OK', 'Good', 'Great', 'Fantastic'],
    faceEmojis: ['😭', '🫤', '😊', '😀', '😎'],
    heartEmojis: ['💙', '❤️', '🧡', '💛', '💚'],
    dotEmojis: ['🔵', '🔴', '🟠', '🟡', '🟢']
  }
}

// Categories
export const CATEGORIES = {
  body: {
    id: 'body',
    name: 'Body',
    description: 'Physical symptoms and sensations',
    color: 'primary'
  },
  mind: {
    id: 'mind',
    name: 'Mind',
    description: 'Mental and emotional states',
    color: 'secondary'
  }
}

// Display types
export const DISPLAY_TYPES = {
  text: 'text',
  face: 'face',
  heart: 'heart',
  dot: 'dot'
}

// Entry types
export const ENTRY_TYPES = {
  morning: 'morning',
  evening: 'evening',
  quick: 'quick'
}

// Sync status
export const SYNC_STATUS = {
  synced: 'synced',
  pending: 'pending',
  failed: 'failed'
}

// Default view times
export const DEFAULT_VIEW_TIMES = {
  morning_end: '09:00',
  evening_start: '20:00'
}

// Helper functions
export const getItemsByCategory = (category) => {
  return Object.values(TRACKING_ITEMS).filter(item => item.category === category)
}

export const getItemsByView = (viewType) => {
  return Object.values(TRACKING_ITEMS).filter(item => item[viewType])
}

export const getDisplayValue = (item, value, displayType) => {
  if (!value) return ''
  
  switch (displayType) {
    case 'text':
      return item.textOptions ? item.textOptions[value - 1] : value
    case 'face':
      return item.faceEmojis ? item.faceEmojis[value - 1] : value
    case 'heart':
      return item.heartEmojis ? item.heartEmojis[value - 1] : value
    case 'dot':
      return item.dotEmojis ? item.dotEmojis[value - 1] : value
    default:
      return value
  }
}

export const getItemColor = (item, value) => {
  if (!value || item.type === 'multi-select') return 'gray'
  
  const isGood = item.good === 'high' ? value >= 4 : value <= 2
  const isBad = item.good === 'high' ? value <= 2 : value >= 4
  
  if (isGood) return 'success'
  if (isBad) return 'danger'
  return 'warning'
} 