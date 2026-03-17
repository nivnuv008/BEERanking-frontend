import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import FeedbackToast from "../../../shared/components/FeedbackToast";
import { getErrorMessage } from "../../../shared/utils/getErrorMessage";
import "../styles/SignIn.css";
import {
  getAuthRedirectPath,
  logout,
  persistAuthSession,
  signIn,
  signInWithGoogle,
} from "../api/authApi";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import GoogleLogo from "../../../shared/assets/google-logo.svg";

type SignInFormData = {
  username: string;
  password: string;
};

function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignInFormData>({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SignInFormData;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleGoogleAuth = useGoogleAuth({
    setIsSubmitting,
    setError,
    navigate,
  });

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await signIn({
        username: formData.username.trim(),
        password: formData.password,
      });

      persistAuthSession(response);
      navigate(getAuthRedirectPath(), { replace: true });
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, "Sign in failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    navigate("/signup");
  };

  const handleClearSession = () => {
    void logout().finally(() => {
      window.location.reload();
    });
  };

  const showClearSession = Boolean(localStorage.getItem("token"));

  return (
    <div className="container-fluid min-vh-100 sign-in-page position-relative">
      {error ? (
        <FeedbackToast
          show
          variant="danger"
          title="Sign in failed"
          message={error}
          onClose={() => setError("")}
        />
      ) : null}

      <div className="row min-vh-100">
        <div className="col-lg-7 d-flex align-items-center justify-content-center sign-in-page__hero">
          <div className="text-center sign-in-page__hero-content">
            <div className="sign-in-page__logo-shell">
              <img
                src="/beer-cheers.png"
                alt="BEERanking"
                className="sign-in-page__logo"
              />
            </div>
            <h1 className="display-4 fw-bold sign-in-page__title">
              Discover and rank the world's{" "}
              <span className="text-warning">best beers</span>, or{" "}
              <span className="text-warning">just watch</span> who's drinking
              them.
            </h1>
          </div>
        </div>

        <div className="col-lg-5 d-flex align-items-center justify-content-center p-5 sign-in-page__panel">
          <Card
            className="w-100 sign-in-page__form-shell border-0"
            style={{ maxWidth: "400px" }}
          >
            <Card.Body className="p-0">
              <h2 className="h3 fw-bold mb-4">Log into BEERanking</h2>

              <form onSubmit={handleSignIn}>
                <div className="mb-3">
                  <Form.Control
                    name="username"
                    type="text"
                    placeholder="Username"
                    size="lg"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-3">
                  <Form.Control
                    name="password"
                    type="password"
                    placeholder="Password"
                    size="lg"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  variant="warning"
                  className="w-100 mb-3 text-white fw-semibold border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Log in"}
                </Button>

                <Button
                  type="button"
                  variant="outline-secondary"
                  className="w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
                  onClick={() =>
                    handleGoogleAuth(signInWithGoogle, "Google sign in failed")
                  }
                  disabled={isSubmitting}
                >
                  <img src={GoogleLogo} alt="Google" width="18" height="18" />
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline-warning"
                  className="w-100 fw-semibold"
                  onClick={handleCreateAccount}
                >
                  Create new account
                </Button>

                {showClearSession ? (
                  <Button
                    type="button"
                    variant="link"
                    className="w-100 mt-3 sign-in-page__clear-session"
                    onClick={handleClearSession}
                  >
                    Clear saved session
                  </Button>
                ) : null}
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
