import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AnalyzePage } from '../pages/AnalyzePage';
import { AcademyPage } from '../pages/AcademyPage';
import { AudioLabPage } from '../pages/AudioLabPage';
import { InstrumentsPage } from '../pages/InstrumentsPage';
import { ProgressPage } from '../pages/ProgressPage';
import { AboutPage } from '../pages/AboutPage';
import { ChoirPage } from '../pages/ChoirPage';
import { LandingPage } from '../pages/LandingPage';
import { PracticePage } from '../pages/PracticePage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ScorePage } from '../pages/ScorePage';
import { SettingsPage } from '../pages/SettingsPage';
import { StudioPage } from '../pages/StudioPage';
import { TranscribePage } from '../pages/TranscribePage';
import { TrackLabPage } from '../pages/TrackLabPage';
import { MixerPage } from '../pages/MixerPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/academy" element={<AcademyPage />} />
        <Route path="/instruments" element={<InstrumentsPage />} />
        <Route path="/audio-lab" element={<AudioLabPage />} />
        <Route path="/track-lab" element={<TrackLabPage />} />
        <Route path="/mixer" element={<MixerPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/transcribe" element={<TranscribePage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/score" element={<ScorePage />} />
        <Route path="/choir" element={<ChoirPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
