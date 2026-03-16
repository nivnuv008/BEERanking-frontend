import { NavigateFunction } from "react-router-dom";
import { getGoogleIdToken } from "../api/googleAuth";
import { getAuthRedirectPath, persistAuthSession } from "../api/authApi";
import { getErrorMessage } from "../../../shared/utils/getErrorMessage";

type Setter<T> = (value: T) => void;

export function useGoogleAuth({
  setIsSubmitting,
  setError,
  navigate,
}: {
  setIsSubmitting: Setter<boolean>;
  setError: Setter<string>;
  navigate: NavigateFunction;
}) {
  return async (
    apiFn: (googleToken: string) => Promise<unknown>,
    errorTitle = "Google auth failed",
  ) => {
    try {
      setIsSubmitting(true);
      setError("");

      const googleToken = await getGoogleIdToken(
        import.meta.env.VITE_GOOGLE_CLIENT_ID,
      );

      const response = await apiFn(googleToken);

      persistAuthSession(response as any);
      navigate(getAuthRedirectPath(), { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err, errorTitle));
    } finally {
      setIsSubmitting(false);
    }
  };
}
