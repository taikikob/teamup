import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import TeamCard from "../components/TeamCard";
import CreateTeamButton from "../components/CreateTeamButton";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Team } from "../types/team";

function Home() {
    
    const {user} = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [teams, setTeams] = useState<Team[]>([]);


    useEffect(() => {
        const fetchTeams = async () => {
            // IMPLEMENT
            const res = await fetch('http://localhost:3000/api/team/get', {
                credentials: 'include',
            });
            const data: Team[] = await res.json();
            setTeams(data);
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
        <> 
            <h1>Hi {user?.first_name}!</h1>
            <h1>My Teams:</h1>
            {teams.length === 0 ? (
                <>
                <p>You are not a part of any groups yet</p>
                </>
            ) : (
                teams.map((team) => (
                    <TeamCard key={team.team_id} team={team} />
                ))
            )}
            <button>Find a group via a code from your coach</button>
            <CreateTeamButton/>
        </>
    )
}

export default Home;