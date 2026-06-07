import { FormEvent, useEffect, useState } from "react";

const UNLOCK_KEY = "couple-menu-unlocked";
const PASSCODE = import.meta.env.VITE_APP_PASSCODE?.trim() || "1201";

interface PasswordGateProps {
  onUnlock: () => void;
}

const onlyDigits = (value: string): string => value.replace(/\D/g, "").slice(0, 4);

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem(UNLOCK_KEY) === "true") {
      onUnlock();
    }
  }, [onUnlock]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (passcode === PASSCODE) {
      localStorage.setItem(UNLOCK_KEY, "true");
      onUnlock();
      return;
    }

    setError("That password is not right.");
  };

  return (
    <main className="gate-shell">
      <section className="gate-card" aria-labelledby="gate-title">
        <div className="app-mark" aria-hidden="true">
          CM
        </div>
        <h1 id="gate-title">Couple Menu</h1>
        <p>Enter our private 4-digit password ❤️</p>

        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="passcode">Private password</label>
          <input
            id="passcode"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]*"
            placeholder="••••"
            value={passcode}
            onChange={(event) => setPasscode(onlyDigits(event.target.value))}
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button">
            Unlock
          </button>
        </form>
      </section>
    </main>
  );
}
