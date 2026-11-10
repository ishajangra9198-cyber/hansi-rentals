
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestDatabase() {
  const [status, setStatus] = useState("Checking connection...");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase
          .from("properties")
          .select("id")
          .limit(1);

        if (error) {
          setStatus("Connection error: " + error.message);
          setIsConnected(false);
        } else {
          setStatus(
            "Connected successfully! Hansi Rentals is talking to Supabase."
          );
          setIsConnected(true);
        }
      } catch (error) {
        setStatus("Something went wrong. Check your configuration.");
        setIsConnected(false);
      }
    }

    testConnection();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        background: "#f5f7f6",
        padding: "30px",
      }}
    >
      <h1 style={{ color: "#123d2b" }}>
        Hansi Rentals
      </h1>

      <h2>Database Connection Test</h2>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          maxWidth: "550px",
          textAlign: "center",
          boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "35px" }}>
          {isConnected ? "✅" : "🔄"}
        </div>

        <p style={{ color: isConnected ? "green" : "#555" }}>
          {status}
        </p>
      </div>
    </main>
  );
}
