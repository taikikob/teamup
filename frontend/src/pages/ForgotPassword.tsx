function ForgotPassword() {
    return (
        <div>
            <h1>Forgot Password</h1>
            <p>Please enter your username and email address to reset your password.</p>
            <form>
                <input type="text" placeholder="Username" required />
                <input type="email" placeholder="Email" required />
                <button type="submit">Send Reset Link</button>
            </form>
        </div>
    );
}

export default ForgotPassword;