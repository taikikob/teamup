import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import TeamCard from "../components/TeamCard";
import JoinTeamButton from "../components/JoinTeamButton";
import CreateTeamButton from "../components/CreateTeamButton";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Team } from "../types/team";
import { Link } from "react-router-dom";
import "../css/Home.css";

function Home() {
    const {isLoadingUser} = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [teams, setTeams] = useState<Team[]>([]);
    const [fetchingTeams, setFetchingTeams] = useState(false);
    
    useEffect(() => {
        const fetchTeams = async () => {
            setFetchingTeams(true);
            const res = await fetch('https://teamup-five.vercel.app/api/teams', {
                credentials: 'include',
            });
            const data: Team[] = await res.json();
            setTeams(data);
            setFetchingTeams(false);
        };
        fetchTeams();
        console.log(teams);
    }, [refreshKey]);

    useEffect(()=>{
        // fetch all the teams that the user is a part of here
        if (location.state?.refresh) {
            setRefreshKey((prev) => prev + 1);
        }
    },[location.state]);

    useEffect(() => {
        if (location.state?.message) {
            toast.success(location.state.message, { position: 'top-center' });

            // only navigate after showing the message
            navigate(location.pathname, {
                replace: true,
                state: { ...location.state, message: undefined }
            });
        }
    }, [location, navigate]);

    return (
        <div className="home-container"> 
            <h1>My Teams:</h1>
            {isLoadingUser || fetchingTeams ? (
                <p>Loading teams...</p>
            ) : (
                <>
                    {teams.length === 0 ? (
                        <>
                            <p className="no-teams-message">You are not a part of any teams yet</p>
                        </>
                    ) : (
                        <div className="team-card-list">
                            {teams.map(team => (
                                <Link to={`/teams/${team.team_id}`} key={team.team_id}>
                                    <TeamCard team={team} />
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
            <div className="home-actions">
                <JoinTeamButton />
                <CreateTeamButton />
            </div>
            
        </div>
    )
}

export default Home;