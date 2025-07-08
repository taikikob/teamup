import { Routes, Route } from 'react-router-dom';
import TeamNav from '../components/TeamNav';
import TeamHomePage from './teamPages/TeamHomePage';
import MasteryPage from './teamPages/MasteryPage';
import AnnouncementsPage from './teamPages/AnnouncementsPage';
import TeammatesPage from './teamPages/TeammatesPage';
import TeamSettingsPage from './teamPages/TeamSettingsPage';

import { TeamProvider } from '../contexts/TeamContext'; // Import your TeamProvider

function Team() {
    return (
        <div style={{ display: 'flex' }}>
            <TeamNav/>
            <div style={{ padding: '1rem', flex: 1 }}>
                <TeamProvider>
                    <Routes>
                        <Route path="/" element={<TeamHomePage />} />
                        <Route path="mastery" element={<MasteryPage />} />
                        <Route path="announcements" element={<AnnouncementsPage />} />
                        <Route path="teammates" element={<TeammatesPage />} />
                        <Route path="settings" element={<TeamSettingsPage />} />
                    </Routes>
                </TeamProvider>
            </div>
        </div>
    );
}

export default Team;