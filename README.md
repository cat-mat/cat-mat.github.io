# What Even With My Hot Self?! 🔥

A body, mind, and emotional changes tracker for women in perimenopause and beyond. This Progressive Web App (PWA) provides personalized tracking with time-based views and data visualization.

## Features

### 🌅 Time-Based Views
- **Morning Report** (before 10 AM): Track sleep, energy, and wearable data
- **Evening Report** (after 7 PM): Reflect on your day with sentiment tracking
- **Quick Track** (10 AM - 7 PM): Rapid check-ins throughout the day

### 📱 Progressive Web App
- Works offline with automatic sync when connected
- Add to home screen for app-like experience
- Mobile-first responsive design

### 🔒 Privacy-First
- Data stored in your personal Google Drive
- No data shared with third parties
- Client-side encryption for sensitive data

### 📊 Smart Tracking
- 18+ customizable tracking items
- Multiple display options (text, emojis, hearts, dots)
- Wearable integration (sleep score, body battery)
- Daily notes and reflections

### ⚡ Real-Time Sync
- Automatic Google Drive synchronization
- Offline support with sync queue
- Conflict resolution with timestamp validation

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Cloud Platform account (for Google Drive API)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd what-even-with-my-hot-self
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Drive API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins
   - Download the client configuration

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_ENVIRONMENT=development
   VITE_MOCK_GOOGLE_DRIVE=false
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── AuthScreen.jsx   # Google Drive authentication
│   ├── Dashboard.jsx    # Main app interface
│   ├── TrackingForm.jsx # Data entry forms
│   └── ...
├── constants/           # App constants and configurations
│   └── trackingItems.js # Tracking item definitions
├── services/           # External service integrations
│   └── googleDriveService.js # Google Drive API
├── stores/             # State management
│   └── appStore.js     # Main Zustand store
├── utils/              # Utility functions
│   └── validation.js   # Data validation schemas
└── main.jsx           # App entry point
```

### Mock Mode

For development without Google Drive API:
```env
VITE_MOCK_GOOGLE_DRIVE=true
```

This enables mock data and simulated API responses.

## Deployment

### GitHub Pages

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   - Push to `gh-pages` branch
   - Configure GitHub Pages in repository settings
   - Set custom domain if desired

### Environment Variables for Production

```env
VITE_GOOGLE_CLIENT_ID=your_production_client_id
VITE_ENVIRONMENT=production
VITE_MOCK_GOOGLE_DRIVE=false
```

## Configuration

### Tracking Items

The app includes 18+ tracking items organized into categories:

**Body Items:**
- Energy Level (5-point scale)
- Forehead Shine (3-point scale)
- Headache (4-point scale)
- Hot Flashes (4-point scale)
- Joint Pain (multi-select)
- Nausea (3-point scale)
- Temperature Sensitivity (3-point scale)
- Workout Recovery (3-point scale)

**Mind Items:**
- Anxiety (5-point scale)
- Brain Fog (3-point scale)
- Depression (5-point scale)
- Irritability (5-point scale)
- Mood (3-point scale)
- Stress Level (5-point scale)

**Morning Only:**
- Sleep Feeling (3-point scale)
- Wearable's Sleep Score (0-100)
- Wearable's Body Battery (0-100)

**Evening Only:**
- Overall Sentiment (5-point scale)

### Display Options

Choose from four display types:
- **Text**: "Very Low", "Low", "Moderate", "High", "Very High"
- **Face Emojis**: 😁, 🙂, 😐, 😧, 😭
- **Heart Emojis**: 💚, 💛, 🧡, ❤️, 💜
- **Dot Emojis**: 🟢, 🟡, 🟠, 🔴, 🟣

## Data Storage

### Google Drive Integration
- Uses Google Drive API with app-data scope
- Creates hidden folder in user's Google Drive
- Monthly JSON files for tracking data
- Configuration stored in `config.json`

### Local Storage
- Current month's data cached locally
- Offline entries stored with sync queue
- Configuration and preferences

### Data Schema

```json
{
  "version": "1.2.0",
  "month": "2025-01",
  "entries": [
    {
      "id": "entry_1737014200000",
      "timestamp": "2025-01-15T08:30:00.000Z",
      "type": "morning",
      "sync_status": "synced",
      "energy_level": 3,
      "sleep_feeling": 2,
      "notes": {
        "observations": "Had a good day overall",
        "reflections": "Feeling more energetic lately",
        "thankful_for": "My supportive friends"
      }
    }
  ]
}
```

## Privacy & Security

### Data Protection
- All data stored in user's Google Drive
- No server-side data storage
- Client-side encryption for sensitive notes
- No analytics or tracking without consent

### Google Drive Permissions
- **Scope**: `https://www.googleapis.com/auth/drive.appdata`
- **Access**: Only to app-specific folder
- **Visibility**: Hidden from main Drive interface

## Contributing

This is a personal project with limited scope (6 users). For feature requests or bug reports, please contact the maintainer directly.

## License

MIT License - see LICENSE file for details.

## Support

For support or questions:
- Check the app's built-in help
- Review the configuration options
- Contact the maintainer for technical issues

---

**Built with ❤️ for women navigating perimenopause**