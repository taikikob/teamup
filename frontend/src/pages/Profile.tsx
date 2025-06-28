import { useUser } from "../contexts/UserContext";

function Profile() {

    const {user} = useUser();

    return (
        <>
            <h3>Player Profile</h3>
            <img src="/mitoma_pp.png" alt="Mitoma Profile"/>
            <p>Name: {user?.first_name} {user?.last_name}</p>
            <p>email: {user?.email}</p>
        </>
    )
}

export default Profile