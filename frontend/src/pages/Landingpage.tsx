import { Link } from "react-router-dom";
import "../css/LandingPage.css"

function Landingpage() {
    return (
        <>
            <div className="landing-page">
                <div className="main-content">
                    <div className="hero">
                        <div className="hero-text-container">
                            <h1 className="hero-title">Structured Training, Anywhere, Anytime.</h1>
                            <p>
                                "Casa" means "home" in Spanish, and our name—Casatrain—captures our mission: empowering athletes to make the most of their home training. We believe that the work athletes put in is what separates the good from the great.
                            </p>
                            <p className="hero-subtitle">
                                Empower your players with personalized training roadmaps. Monitor progress, provide feedback, and build better teams.
                            </p>
                            <div className="exampleRoadmap">
                                <img src="exampleRoadmap.png" alt="Example Roadmap" />
                            </div>
                            <Link to="/signup" className="cta-button hero-cta">Join TeamUp Today</Link>
                        </div>
                    </div>
                    <div className="roadmap-info">
                        <h2>The Roadmap to Success</h2>
                        <p>
                            casatrain's core feature allows you to build and share interactive "roadmaps." These structured learning paths guide players through drills and challenges, turning solo practice into a powerful tool for development.
                        </p>
                    </div>

                    <div className="features">
                    <div className="feature-card">
                        <h2>For Coaches</h2>
                        <p>
                        Create customizable, step-by-step training roadmaps. Easily assign tasks, post resources, and track player progress from a central dashboard.
                        </p>
                        <p>Include picture/video of roadmap being created</p>
                    </div>
                    <div className="feature-card">
                        <h2>For Players</h2>
                        <p>
                        Follow a clear, structured path designed by your coach to improve skills on your own time. Receive direct feedback and stay motivated with a clear plan.
                        </p>
                        <p>Show picture/video of submitting tasks, seeing your progress, receiving feedback</p>
                    </div>
                    <div className="feature-card">
                        <h2>For Parents</h2>
                        <p>
                        Support your child's development with a clear program they can follow. Be confident they are practicing with purpose and structure.
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Landingpage;