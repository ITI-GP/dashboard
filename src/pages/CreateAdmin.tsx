import { useEffect, useState } from "react";
import { supabase } from "@/providers/supabaseClient";

const CreateAdmin = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("omniaeid314@gmail.com");
  const [password, setPassword] = useState("Oeahna@12");

  const createAdmin = async () => {
    setLoading(true);
    setMessage("Creating admin user...");

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "admin",
          },
        },
      });

      if (error) throw error;

      // Update the users table with the role
      const { error: updateError } = await supabase
        .from("users")
        .update({ role: "admin" })
        .eq("id", data.user?.id);

      if (updateError) throw updateError;

      setMessage(
        `Admin user created successfully! Email: ${email}, Password: ${password}`,
      );
    } catch (error: any) {
      console.error("Error:", error);
      setMessage(`Error: ${error?.message || "An unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "600px",
        margin: "2rem auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem" }}>Create Admin User</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Email:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "1rem",
            marginBottom: "1rem",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Password:
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ddd",
          }}
        />
      </div>

      <button
        onClick={createAdmin}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s",
          ":hover:not(:disabled)": {
            backgroundColor: "#0056b3",
          },
        }}
      >
        {loading ? "Creating..." : "Create Admin User"}
      </button>

      {message && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: message.includes("Error") ? "#f8d7da" : "#d4edda",
            color: message.includes("Error") ? "#721c24" : "#155724",
            borderRadius: "4px",
            border: `1px solid ${
              message.includes("Error") ? "#f5c6cb" : "#c3e6cb"
            }`,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default CreateAdmin;
