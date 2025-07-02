import { useUser } from "../contexts/UserContext";
import { useEffect } from "react";
import TeamCard from "../components/TeamCard";

function Home() {
    
    const {user} = useUser();

    useEffect(()=>{
        // fetch all the teams that the user is a part of here

    },[])

    return (
        <> 
            <h1>Hi {user?.first_name}!</h1>
            <h1>My Teams:</h1>
            <div>
                
                <p>You are not a part of any groups yet</p>
                <button>Find a group via a code from your coach</button>
            </div>
        </>
    )
}

export default Home