import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { getHistoryOfUser } = authContext;

  interface Meeting {
    meetingCode: string;
    date: string;
  }
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // Optional: add snackbar for error handling
      }
    })();
  }, [getHistoryOfUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div>
      <IconButton onClick={() => navigate("/dashboard")}>
        <HomeIcon />
      </IconButton>

      {meetings.length > 0 ? (
        meetings.map((e, i) => (
          <Card key={i} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography
                sx={{ fontSize: 14 }}
                color="text.secondary"
                gutterBottom
              >
                Code: {e.meetingCode}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                Date: {formatDate(e.date)}
              </Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No meeting history available.
        </Typography>
      )}
    </div>
  );
}
