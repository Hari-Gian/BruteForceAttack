"use client";

import { Flex, Heading, Input, Link, Text, Button } from "@chakra-ui/react";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function Register()
{
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
const [captchaKey, setCaptchaKey] = useState(0); // Forces re-render of hCaptcha widget when key changes
    const captchaRef = useRef<HCaptcha | null>(null);

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

    const handleRegister = async () => {
        console.log("Registration attempt initiated");
        
        if (!captchaToken) {
        console.warn("Registration attempt without captcha");
        setError("Please complete the captcha");
        return;
        }

        if (!username || !email || !password) {
        console.warn("Registration attempt with missing fields");
        setError("All fields are required");
        return;
        }

// Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
        console.warn("Registration attempt with invalid email format");
        setError("Please enter a valid email address");
        return;
        }

// Verify password length
        if (password.length < 6) {
        console.warn("Registration attempt with weak password");
        setError("Password must be at least 6 characters long");
        return;
        }

        try {
        console.log("Sending registration request", { email, username });
        
        const resp = await fetch("http://localhost:42069/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
            username, 
            email, 
            password, 
            captcha: captchaToken 
            }),
        });

        resetCaptchaSafe();
        setCaptchaToken("");

        if (resp.status === 400) {
            const js = await resp.json();
            console.warn("Bad request during registration", js.error);
            setError(js.error || "Invalid request");
        } else if (resp.status === 409) {
            const js = await resp.json();
            console.warn("User already exists", js.error);
            setError(js.error || "User already exists");
        } else if (resp.status === 500) {
            console.error("Server error during registration");
            setError("Server error. Please try again later.");
        } else if (resp.ok) {
            console.log("Registration successful");
            router.push("/login");
        } else {
            console.error("Unexpected response status", resp.status);
            setError("An unexpected error occurred");
        }
        } catch (err) {
        console.error("Network error during registration", err);
        setError("Network error. Please check your connection.");
        resetCaptchaSafe();
        }
    };

    return (
        <Flex flexDirection={"column"} flex={1} justifyContent={"space-around"}>
            <Flex flexDirection={"row"} flex={1} justifyContent={"space-around"}>
                <Flex flexDirection={"column"} justifyContent={"center"} gap={"20px"}>
                    <Heading>Register</Heading>
                    <Flex flexDirection={"column"}>
                        <Text color={"red"}>{error}</Text>
                        <Text>Username</Text>
                        <Input value={username} onChange={(e)=>{setUsername(e.target.value)}} type="text"></Input>
                        <Text>E-Mail</Text>
                        <Input value={email} onChange={(e)=>{setEmail(e.target.value)}} type="email"></Input>
                        <Text>Password</Text>
                        <Input value={password} onChange={(e)=>{setPassword(e.target.value)}} type="password"></Input>
                    </Flex>
                    <Button
                        onClick={handleRegister}
                        colorScheme="teal"
                    >
                        <LuArrowRight></LuArrowRight> Register
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
