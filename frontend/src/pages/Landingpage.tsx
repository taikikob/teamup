import "../css/LandingPage.css"

function Landingpage() {
    return (
        <>
            <div className="landing-page">
                <div className="main-content">
                    <div className="hero">
                        <div className="hero-text-container">
                            <h1 className="hero-title">Structured Training, Anywhere, Anytime.</h1>
                            <div className="logo-img">
                                {/* You could add a background image or an illustration here */}
                                {/* Example: <img src="training_illustration.png" alt="Training illustration" /> */}
                            </div>
                            <p>
                                Time spent outside of practice separates good players from great ones. TeamUp helps coaches create clear, actionable training plans that players can follow on their own time.
                            </p>
                            <p className="hero-subtitle">
                                Empower your players with personalized training roadmaps. Monitor progress, provide feedback, and build better teams.
                            </p>
                            <a href="#get-started" className="cta-button hero-cta">Join TeamUp Today</a>
                        </div>
                    </div>

                    <div className="features">
                    <div className="feature-card">
                        <h2>For Coaches</h2>
                        <p>
                        Create customizable, step-by-step training roadmaps. Easily assign tasks, post resources, and track player progress from a central dashboard.
                        </p>
                    </div>
                    <div className="feature-card">
                        <h2>For Players</h2>
                        <p>
                        Follow a clear, structured path designed by your coach to improve skills on your own time. Receive direct feedback and stay motivated with a clear plan.
                        </p>
                    </div>
                    <div className="feature-card">
                        <h2>For Parents</h2>
                        <p>
                        Support your child's development with a clear program they can follow. Be confident they are practicing with purpose and structure.
                        </p>
                    </div>
                    </div>

                    <div className="roadmap-info">
                    <h2>The Roadmap to Success</h2>
                    <p>
                        TeamUp's core feature allows you to build and share interactive "roadmaps." These structured learning paths guide players through drills and challenges, turning solo practice into a powerful tool for development.
                    </p>
                    </div>
                </div>

                <footer className="footer">
                    <p>&copy; 2025 TeamUp. All rights reserved.</p>
                </footer>
            </div>
        </>
    )
}

export default Landingpage;