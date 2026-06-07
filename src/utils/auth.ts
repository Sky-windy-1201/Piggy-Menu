import { onAuthStateChanged, signInAnonymously, type Unsubscribe } from "firebase/auth";
import { auth } from "../firebase";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("configuration-not-found")) {
      return "Firebase Authentication is not enabled yet. Open Firebase Console > Authentication > Get started, then enable Anonymous sign-in.";
    }

    if (message.includes("admin-restricted-operation")) {
      return "Anonymous sign-in is disabled. Open Firebase Console > Authentication > Sign-in method, then enable Anonymous.";
    }

    return error.message;
  }

  return "Anonymous sign-in failed.";
};

export const subscribeToAnonymousAuth = (
  onUid: (uid: string) => void,
  onError: (message: string) => void
): Unsubscribe => {
  const firebaseAuth = auth;

  if (!firebaseAuth) {
    onError("Connection is not ready yet.");
    return () => undefined;
  }

  let signInStarted = false;

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      onUid(user.uid);
      return;
    }

    if (signInStarted) {
      return;
    }

    signInStarted = true;
    signInAnonymously(firebaseAuth)
      .then((credential) => {
        onUid(credential.user.uid);
      })
      .catch((error: unknown) => {
        onError(getErrorMessage(error));
      });
  });
};
