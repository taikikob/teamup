import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import TeamCard from "../components/TeamCard";
import CreateTeamButton from "../components/CreateTeamButton";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function Home() {
    
    const {user} = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);


    useEffect(() => {
        const fetchTeams = () => {
            // IMPLEMENT
            console.log(user);
        };
        fetchTeams();
    }, [refreshKey]);

    useEffect(()=>{
        // fetch all the teams that the user is a part of here
        if (location.state?.refresh) {
            setRefreshKey((prev) => prev + 1);
        }
    },[location.state]);

    useEffect(() => {
        // display team creation success message if available
        if (location.state?.message) {
            toast.success(location.state?.message, { position: 'top-center' });
        }
        navigate(location.pathname, { replace: true });
    }, [location, navigate]);

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