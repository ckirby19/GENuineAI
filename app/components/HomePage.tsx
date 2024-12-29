
interface Props {
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    isNameEntered: boolean;
    setIsNameEntered: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HomePage = (props: Props) => {
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (props.username.trim()) {
          props.setIsNameEntered(true);
        }
    };
    return (
        <main className="mobile-friendly">
            <h1>GENuineAI</h1>
            <h2>Can you tell friend from (Generative AI) foe?</h2>
            <form onSubmit={handleNameSubmit} className="name-form">
                <input
                type="text"
                placeholder="Enter your name"
                value={props.username}
                onChange={(e) => props.setUsername(e.target.value)}
                required
                />
                <button type="submit">Submit</button>
            </form>

        </main>
      );
}
