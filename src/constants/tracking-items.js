import { getEffectiveScale, is3PointScale } from '../utils/scale-conversion.js'
import { SCALE_TYPES } from './scale-types.js'

// Tracking items configuration
export const TRACKING_ITEMS = {
  allergic_reactions: {
    id: 'allergic_reactions',
    name: 'Allergic Reactions',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'Experiencing any allergic reactions?',
    morning: false,
    evening: true,
    quick: true,
    textOptions: ['Feeling good', 'Some reactions', 'Bah, I\'m over it!'],
    faceEmojis: ['😎', '😕', '😵'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  anxiety: {
    id: 'anxiety',
    name: 'Anxiety',
    category: 'mind',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'low',
    description: 'Yeah, no, I\'m fine. Well, actually...',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m good', 'Maybe a little anxious', 'This is normal, right?', 'I\'m freaking out', 'OMG, leave me alone!'],
    faceEmojis: ['😎', '😊', '😳', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  bleeding_spotting: {
    id: 'bleeding_spotting',
    name: 'Bleeding or Spotting',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'Oh, hey, Flow... 🤨',
    morning: true,
    evening: false,
    quick: false,
    textOptions: ['None', 'Spotting', 'Bleeding'],
    faceEmojis: ['😎', '😳', '😫'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  brain_fog: {
    id: 'brain_fog',
    name: 'Brain Fog',
    category: 'mind',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
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
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'low',
    description: 'Feeling a little meh...',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['None', 'Minimal', 'Mild', 'Moderate', 'Severe'],
    faceEmojis: ['😎', '😊', '😳', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  diet_triggers: {
    id: 'diet_triggers',
    name: 'Diet Triggers',
    category: 'body',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'low',
    description: 'Something I ate made my body throw a tantrum!',
    morning: false,
    evening: false,
    quick: true,
    textOptions: ['No food drama', 'Slight grumble', 'Not happy', 'Definitely triggered', 'Food rebellion'],
    faceEmojis: ['😎', '😐', '😕', '😣', '🤢'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  eating_habits: {
    id: 'eating_habits',
    name: 'Eating Habits',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'Mmmm, fooooooood 🤤',
    morning: false,
    evening: true,
    quick: false,
    textOptions: ['Good enough', 'Could be better', 'Ask me tomorrow'],
    faceEmojis: ['🥘', '🍕', '🎂'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  energy_level: {
    id: 'energy_level',
    name: 'Energy Level',
    category: 'body',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'high',
    description: 'I\'m ready to take on the world!',
    morning: true,
    evening: false,
    quick: true,
    textOptions: ['Maybe tomorrow', 'Eh', 'Sure', 'Yeah!', 'Let\'s do this!'],
    faceEmojis: ['😭', '🫤', '😊', '😀', '😎'],
    heartEmojis: ['💙', '❤️', '🧡', '💛', '💚'],
    dotEmojis: ['🔵', '🔴', '🟠', '🟡', '🟢']
  },
  exercise_impact: {
    id: 'exercise_impact',
    name: 'Exercise Impact',
    category: 'body',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'high',
    description: 'How did your body feel after that workout (or lack thereof)?',
    morning: false,
    evening: false,
    quick: true,
    textOptions: ['Couch potato', 'Light movement', 'Decent workout', 'Good sweat', 'Beast mode'],
    faceEmojis: ['🛋️', '🚶‍♀️', '🏃‍♀️', '💪', '🏋️‍♀️'],
    heartEmojis: ['💙', '❤️', '🧡', '💛', '💚'],
    dotEmojis: ['🔵', '🔴', '🟠', '🟡', '🟢']
  },
  forehead_shine: {
    id: 'forehead_shine',
    name: 'Forehead Shine',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'How glossy is that forehead of yours?',
    morning: false,
    evening: false,
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
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'Bleh, is that a headache?',
    morning: false,
    evening: false,
    quick: true,
    textOptions: ['Nope', 'Not too bad', 'I\'m going to bed'],
    faceEmojis: ['😎', '😐', '😭'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  hormone_symptoms: {
    id: 'hormone_symptoms',
    name: 'Hormone Symptoms',
    category: 'body',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'low',
    description: 'How much are your hormones making themselves known today?',
    morning: false,
    evening: false,
    quick: true,
    textOptions: ['Chill hormones', 'A little moody', 'Definitely hormonal', 'Very hormonal', 'Hormone hurricane'],
    faceEmojis: ['😎', '😐', '😤', '😠', '😡'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  hot_flashes: {
    id: 'hot_flashes',
    name: 'Hot Flashes',
    category: 'body',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'low',
    description: 'Hot flashes? I\'m on fire!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m good', 'A bit warm', 'Kinda toasty', 'I need a fan, now!', 'I AM THE SUN!'],
    faceEmojis: ['😎', '😓', '🫠', '🥵', '🔥'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  hydration: {
    id: 'hydration',
    name: 'Hydration',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'high',
    description: 'How well hydrated are you feeling? (Be honest!)',
    morning: false,
    evening: true,
    quick: true,
    textOptions: ['Desert dry', 'Could use more', 'Well hydrated'],
    faceEmojis: ['🏜️', '💧', '🌊'],
    heartEmojis: ['❤️', '💛', '💚'],
    dotEmojis: ['🔴', '🟡', '🟢']
  },
  irritability: {
    id: 'irritability',
    name: 'Irritability',
    category: 'mind',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
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
  joint_pain: {
    id: 'joint_pain',
    name: 'Joint Pain',
    category: 'body',
    type: 'multi-select',
    scale_type: SCALE_TYPES.MULTI_SELECT,
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
  mood: {
    id: 'mood',
    name: 'Mood',
    category: 'mind',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'high',
    description: 'I feel good, I feel great, I feel aaaaahhmazing!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Shut up', 'I\'m fine', 'Yaaas, queen!'],
    faceEmojis: ['😡', '🙂', '😎'],
    heartEmojis: ['❤️', '💛', '💚'],
    dotEmojis: ['🔴', '🟡', '🟢']
  },
  nausea: {
    id: 'nausea',
    name: 'Nausea',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
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
  overall_sentiment: {
    id: 'overall_sentiment',
    name: 'Overall Sentiment',
    category: 'mind',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'high',
    description: 'Today was a ____ day',
    morning: false,
    evening: true,
    quick: false,
    textOptions: ['Bad', 'OK', 'Good', 'Great', 'Fantastic'],
    faceEmojis: ['😭', '🫤', '😊', '😀', '😎'],
    heartEmojis: ['💙', '❤️', '🧡', '💛', '💚'],
    dotEmojis: ['🔵', '🔴', '🟠', '🟡', '🟢']
  },
  pill_pack_start_date: {
    id: 'pill_pack_start_date',
    name: 'Pill Pack Start Date',
    category: 'body',
    type: 'date',
    format: 'MM/DD/YYYY',
    description: 'What date did you start your pill pack?',
    morning: true,
    evening: false,
    quick: false
  },
  sleep_quality: {
    id: 'sleep_quality',
    name: 'Sleep Quality',
    category: 'body',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'high',
    description: 'Did you sleep like a baby or like a cat on a hot tin roof?',
    morning: true,
    evening: false,
    quick: false,
    textOptions: ['What is sleep?', 'Tossed and turned', 'Not bad', 'Pretty good', 'Like a log'],
    faceEmojis: ['😵', '😧', '😐', '😊', '😴'],
    heartEmojis: ['💙', '❤️', '🧡', '💛', '💚'],
    dotEmojis: ['🔵', '🔴', '🟠', '🟡', '🟢']
  },
  social_stamina: {
    id: 'social_stamina',
    name: 'Social Stamina',
    category: 'mind',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'high',
    description: 'How much social interaction can you handle today?',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Hermit mode', 'Small talk only', 'Friends are okay', 'Party ready', 'Social butterfly'],
    faceEmojis: ['🏠', '😐', '😊', '😄', '🦋'],
    heartEmojis: ['💙', '💛', '🧡', '❤️', '💚'],
    dotEmojis: ['🔵', '🟡', '🟠', '🔴', '🟢']
  },
  stress_level: {
    id: 'stress_level',
    name: 'Stress Level',
    category: 'mind',
    scale: 5,
    scale_type: SCALE_TYPES.FIVE_POINT,
    good: 'low',
    description: 'Yikes, I have shoulder earrings right now!',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['I\'m super chill', 'Not bad', 'Meh', 'A little tense', 'OMG, leave me alone!'],
    faceEmojis: ['😎', '😊', '😳', '😧', '😭'],
    heartEmojis: ['💚', '💛', '🧡', '❤️', '💜'],
    dotEmojis: ['🟢', '🟡', '🟠', '🔴', '🟣']
  },
  temperature_sensitivity: {
    id: 'temperature_sensitivity',
    name: 'Temperature Sensitivity',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'Yeesh, is the A/C set to 40° right now?!',
    morning: false,
    evening: true,
    quick: true,
    textOptions: ['What temperature swing?', 'Feeling normal', 'Gimme that blanket!'],
    faceEmojis: ['😎', '😊', '😰'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
  },
  workout_recovery: {
    id: 'workout_recovery',
    name: 'Workout Recovery',
    category: 'body',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'high',
    description: 'How are you feeling after that workout?',
    morning: true,
    evening: true,
    quick: true,
    textOptions: ['Everything hurts', 'A little sore', 'Feeling great!'],
    faceEmojis: ['😭', '😊', '💪'],
    heartEmojis: ['❤️', '💛', '💚'],
    dotEmojis: ['🔴', '🟡', '🟢']
  },
  wearables_body_battery: {
    id: 'wearables_body_battery',
    name: 'Wearable\'s Body Battery',
    category: 'body',
    type: 'number',
    scale_type: SCALE_TYPES.NUMERIC,
    min: 0,
    max: 100,
    good: 'high',
    description: 'How does your wearable think you\'re doing?',
    morning: true,
    evening: false,
    quick: false
  },
  wearables_sleep_score: {
    id: 'wearables_sleep_score',
    name: 'Wearable\'s Sleep Score',
    category: 'body',
    type: 'number',
    scale_type: SCALE_TYPES.NUMERIC,
    min: 0,
    max: 100,
    good: 'high',
    description: 'How did your wearable think you slept?',
    morning: true,
    evening: false,
    quick: false
  },
  weird_dreams: {
    id: 'weird_dreams',
    name: 'Weird Dreams',
    category: 'mind',
    scale: 3,
    scale_type: SCALE_TYPES.THREE_POINT,
    good: 'low',
    description: 'I had the weirdest dreams last night!',
    morning: true,
    evening: false,
    quick: false,
    textOptions: ['No dreams', 'Normal dreams', 'The weirdest dreams!'],
    faceEmojis: ['😎', '😊', '😫'],
    heartEmojis: ['💚', '💛', '❤️'],
    dotEmojis: ['🟢', '🟡', '🔴']
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

  const index = (val) => Math.min(Math.max(val, 1), 5) - 1
  const text = item.textOptions?.[index(value)] ?? String(value)
  const face = item.faceEmojis?.[index(value)] ?? text
  const heart = item.heartEmojis?.[index(value)] ?? text
  const dot = item.dotEmojis?.[index(value)] ?? text

  switch (displayType) {
    case 'text':
      return text
    case 'face':
      return face
    case 'heart':
      return heart
    case 'dot':
      return dot
    default:
      return text
  }
}

// Unified label helper for visuals + accessibility
export const getValueLabels = (item, value, displayType) => {
  const displayText = getDisplayValue(item, value, displayType)
  const ariaLabel = `${item.name}: ${typeof displayText === 'string' ? displayText : String(value)}`
  return { displayText, ariaLabel }
}

export const getItemColor = (item, value) => {
  if (!value || item.type === 'multi-select') return 'gray'
  
  // Use effective scale for color determination (5-point for 3-point items)
  const effectiveScale = getEffectiveScale(item.scale)
  const isGood = item.good === 'high' ? value >= (effectiveScale * 0.8) : value <= (effectiveScale * 0.4)
  const isBad = item.good === 'high' ? value <= (effectiveScale * 0.4) : value >= (effectiveScale * 0.8)
  
  if (isGood) return 'success'
  if (isBad) return 'danger'
  return 'warning'
}

// Helper function to get effective scale for any item
export const getItemEffectiveScale = (item) => {
  const scaleFromType = item.scale_type === '3-point' ? 3 : item.scale_type === '5-point' ? 5 : undefined
  const scale = scaleFromType || item.scale
  return getEffectiveScale(scale)
}

// Helper function to check if item uses 3-point scale
export const isItem3PointScale = (item) => {
  if (item.scale_type) {
    return item.scale_type === '3-point'
  }
  return is3PointScale(item.scale)
}