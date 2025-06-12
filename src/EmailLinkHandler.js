// src/EmailLinkHandler.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

export default function EmailLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        email = window.prompt("Please enter your email to complete sign-in:");
      }
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem("emailForSignIn");
          navigate("/");
        })
        .catch((error) => {
          alert("Email sign-in failed: " + error.message);
          navigate("/");
        });
    }
    // eslint-disable-next-line
  }, []);
  return null;
}
