"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const [seconds, setSeconds] = useState(5);
  const router = useRouter();

  useEffect(() => {
    if (seconds === 0) {
      // Limpa tokens/localStorage e redireciona para login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/login");
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Logout</h1>
        <p className="mb-2">Você será desconectado em</p>
        <span className="text-4xl font-mono text-blue-600">{seconds}</span>
        <p className="mt-4 text-gray-500">Redirecionando para o login...</p>
      </div>
    </div>
  );
}
