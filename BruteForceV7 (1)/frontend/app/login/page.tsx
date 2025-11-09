"use client";

import { Flex, Heading, Input, Text, Button, Icon } from "@chakra-ui/react";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuArrowRight } from "react-icons/lu";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [until, setUntil] = useState(0);
  const [untilT, setUntilT] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0); // Forces re-render of hCaptcha widget when key changes
  const captchaRef = useRef<HCaptcha | null>(null);

// Manages countdown for temporarily blocked accounts
  useEffect(() => {
    if (!until) return;

    const interval = setInterval(() => {
      setUntilT(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
      if (Date.now() >= until) {
        setUntil(0);
        setError("");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [until]);

// Utility to safely reset the captcha widget
  function resetCaptchaSafe() {
    try {
// Attempt reset using hCaptcha component method
      if (captchaRef.current && typeof captchaRef.current.resetCaptcha === "function") {
        captchaRef.current.resetCaptcha();
        return;
      }

// Try resetting via global hCaptcha object if component method fails
      if (
        typeof window !== "undefined" &&
        (window as any).hcaptcha &&
        captchaRef.current &&
        typeof (captchaRef.current as any).getWidgetId === "function"
      ) {
        const wid = (captchaRef.current as any).getWidgetId();
        if (typeof wid !== "undefined") {
          (window as any).hcaptcha.reset(wid);
          return;
        }
      }

// Fallback: force component remount to reset
      setCaptchaKey((k) => k + 1);
    } catch (err) {
      setCaptchaKey((k) => k + 1);
    }
  }

  const handleLogin = async () => {
    console.log("Login attempt initiated");
    
    if (!captchaToken) {
      console.warn("Login attempt without captcha");
      setError("Please complete the captcha");
      return;
    }

    if (!email || !password) {
      console.warn("Login attempt with missing credentials");
      setError("Email and password are required");
      return;
    }

    try {
      console.log("Sending login request", { email });
      
      const resp = await fetch("http://localhost:42069/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captcha: captchaToken }),
      });

      resetCaptchaSafe();
      setCaptchaToken("");

      if (resp.status === 400) {
        const js = await resp.json();
        console.warn("Bad request during login", js.error);
        setError(js.error || "Invalid request");
      } else if (resp.status === 401) {
        const js = await resp.json();
        console.warn("Invalid credentials", js.error);
        setError(js.error || "Invalid email or password");
      } else if (resp.status === 404) {
        const js = await resp.json();
        console.warn("User not found", js.error);
        setError(js.error || "User not found");
      } else if (resp.status === 420) {
        const js = await resp.json();
        setUntil(js.until);
        console.warn("Too many requests", js.error);
        setError(js.error || "Too fast! Wait before retrying.");
      } else if (resp.status === 500) {
        console.error("Server error during login");
        setError("Server error. Please try again later.");
      } else if (resp.ok) {
        const js = await resp.json();
        console.log("Login successful");
        setCookie("token", js.token);
        router.push("/dashboard");
      } else {
        console.error("Unexpected response status", resp.status);
        setError("An unexpected error occurred");
      }
    } catch (err) {
      console.error("Network error during login", err);
      setError("Network error. Please check your connection.");
      resetCaptchaSafe();
    }
  };

  return (
    <Flex flexDirection={"column"} flex={1} justifyContent={"space-around"}>
      <Flex flexDirection={"row"} flex={1} justifyContent={"space-around"}>
        <Flex flexDirection={"column"} justifyContent={"center"} gap={"20px"}>
          <Heading>Log In</Heading>
          <Flex flexDirection={"column"} gap={"8px"}>
            {error && <Text color={"red"}>{error}</Text>}
            {until !== 0 && <Text color={"red"}>Wait {untilT} s</Text>}

            <Text>E-Mail</Text>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />

            <Text>Password</Text>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </Flex>

          <Button
            onClick={handleLogin}
            colorScheme="teal"
          >
            Log In
          </Button>

          <HCaptcha
            key={captchaKey}
            sitekey="71941510-cc1c-456c-8c76-ad3abcd2293c"
            onVerify={(token) => setCaptchaToken(token)}
            ref={captchaRef}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
