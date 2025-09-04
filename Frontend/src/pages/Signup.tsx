import * as React from "react";
import {
  Box,
  Button,
  CssBaseline,
  TextField,
  Typography,
  Link,
  Stack,
  Alert,
  CircularProgress,
  Card as MuiCard,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: 450,
  padding: theme.spacing(4),
  margin: "auto",
  gap: theme.spacing(2),
}));

export default function Signup() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const validate = () => {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return false;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name,
        username: email,
        password,
      };

      console.log("[Signup] Sending payload:", payload);

      const res = await fetch("http://localhost:8000/api/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }

      console.log("[Signup] Response status:", res.status);
      console.log("[Signup] Response body:", result);

      if (!res.ok) {
        const serverMsg =
          result && (result.message || result.error || JSON.stringify(result));
        setError(`Signup failed: ${serverMsg || res.statusText}`);
        setLoading(false);
        return;
      }

      setSuccess(
        (result && (result.message || JSON.stringify(result))) ||
          "Signed up successfully!"
      );
      setName("");
      setEmail("");
      setPassword("");
      setLoading(false);

      setTimeout(() => {
        window.location.href = "/login";
      }, 900);
    } catch (err: any) {
      console.error("[Signup] Network / unexpected error:", err);
      setError(`Network or server error: ${err?.message || err}`);
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <Stack
        direction="column"
        justifyContent="center"
        sx={{ minHeight: "100vh", p: 2 }}
      >
        <Card variant="outlined">
          <Typography component="h1" variant="h4">
            Sign up
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              label="Full name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 1 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Sign Up"}
            </Button>

            <Typography sx={{ textAlign: "center" }}>
              Already have an account?{" "}
              <Link href="/login" variant="body2">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Card>
      </Stack>
    </>
  );
}
