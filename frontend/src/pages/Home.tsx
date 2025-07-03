import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import TeamCard from "../components/TeamCard";
import CreateTeamButton from "../components/CreateTeamButton";
import { useLocation } from 'react-router-dom';

function Home() {
    
    const {user} = useUser();
    const location = useLocation();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchTeams = () => {
            
        };
    }, [refreshKey]);

    useEffect(()=>{
        // fetch all the teams that the user is a part of here
        if (location.state?.refresh) {
            setRefreshKey((prev) => prev + 1);
        }
    },[location.state])

    return (
        <> 
            <h1>Hi {user?.first_name}!</h1>
            <h1>My Teams:</h1>
            <div>
                <p>You are not a part of any groups yet</p>
                <button>Find a group via a code from your coach</button>
                <CreateTeamButton/>
            </div>
        </>
    )
}

export default Home;