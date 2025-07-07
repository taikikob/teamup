import EditDescriptionButton from "../../components/EditDescriptionButton";
import { useTeam } from "../../contexts/TeamContext";

function TeamHomePage() {
    // coach should be able to view the access codes
    const { teamInfo, isLoadingTeam, teamError} = useTeam(); // Consume the context
    // conditional rendering

    if (isLoadingTeam) {
        return <div className="team-loading">Loading team information...</div>;
    }

    if (teamError) {
        return <div className="team-error">Error: {teamError}</div>;
    }

    if (!teamInfo) {
        return <div className="team-not-found">Team not found or no information available.</div>;
    }

    const coachAccessCode = teamInfo.team_access_codes.find(code => code.role === 'Coach');
    const playerAccessCode = teamInfo.team_access_codes.find(code => code.role === 'Player');

    return (
        <div className="team-home-page">
            <h1>{teamInfo.team_name}</h1>
            <div>
                <strong>Team Description:</strong> {teamInfo.team_description || 'No description provided.'}
                {/* TODO: Add description if no description, edit description if one exists */}
                {teamInfo.is_user_coach && (
                    <EditDescriptionButton/>
                )}
            </div>
            {/* TODO: Coach if only 1 coach, coaches if more than 1 coach */}
            <h2>Coaches:</h2>
            {teamInfo.coaches_info && teamInfo.coaches_info.length > 0 ? (
                <div>
                    {teamInfo.coaches_info.map((coach) => (
                        <div key={coach.user_id}>
                            {coach.first_name} {coach.last_name} ({coach.email})
                        </div>
                    ))}
                </div>
            ) : (
                <p>No coaches listed for this team.</p>
            )}
            {/* Display Access Codes ONLY IF the current user is a coach */}
            {teamInfo.is_user_coach && (
                <div>
                    <h2>Access Codes:</h2>
                    <p>
                        <strong>Coach Access Code:</strong>{" "}
                        {coachAccessCode ? ( // <-- Ternary operator for inner condition
                            <>
                                {coachAccessCode.code} (Expires: {new Date(coachAccessCode.expires_at).toLocaleDateString()})
                            </>
                        ) : (
                            "N/A"
                        )}
                    </p>
                    <p>
                        <strong>Player Access Code:</strong>{" "}
                        {playerAccessCode ? ( // <-- Ternary operator for inner condition
                            <>
                                {playerAccessCode.code} (Expires: {new Date(playerAccessCode.expires_at).toLocaleDateString()})
                            </>
                        ) : (
                            "N/A"
                        )}
                    </p>
                </div>
            )}
        </div>
    )
}

export default TeamHomePage;