import "../css/About.css"

function About() {
    return (
        <div className="about-page">
            <div className="title">About the Creator</div>
            <div className="content">
                <img src="/taiki.png" alt="Taiki Kobayashi" className="picture"/>
                <div className="description">
                    <div>Hi! I'm Taiki, a software engineer and the creator of casatrain.</div>
                    <div>I am currently a Junior at the University of Michigan studying CS and Math. I enjoy using my problem solving and programming abilities to create projects that provide a positive impact to communities, like casatrain!</div>
                    <div>Fun Fact: Born in Brighton, England, I was raised in Tokyo and Honolulu, and studied abroad in Argentina.</div>
                    <div>
                        <a href="https://www.linkedin.com/in/taiki-kobayashi/" target="_blank" rel="noopener noreferrer">
                            <img src="/linkedin.svg" alt="Link to Taiki's LinkedIn" className="icon"/>
                        </a>
                        <a href="https://github.com/taikikob" target="_blank" rel="noopener noreferrer">
                            <img src="/github.svg" alt="Link to Taiki's GitHub" className="icon"/>
                        </a>
                    </div>
                    
                </div>
            </div>
            <div className="content">
                <div className="description">
                    <div>
                        I originally came up with the idea to build casatrain from my wanting a way to help my little brother improve his soccer skills while I was in Michigan and he was in Hawaii. 
                    </div>
                    <div>
                        Then, I thought many athletes could benefit from a strucutred training program built by their coach to follow at home.
                    </div>
                    <div>
                        As a former soccer player myself, I believe that practice at home is just as if not more important than practice with the team.
                    </div>
                </div>
                <img src="/taikiSoccer.png" alt="Taiki Kobayashi" className="picture"/>
            </div>
        </div>
    );
}
export default About;