import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        p: 3,
      }}
    >
      <Typography sx={{ fontSize: 96, lineHeight: 1 }}>🧦</Typography>
      <Typography variant="h3" fontWeight={800}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Oops — we can't find that page
      </Typography>
      <Typography variant="body2" color="text.secondary">
        It might have been moved, deleted, or never existed.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate("/app")}
        sx={{ mt: 1 }}
      >
        Back to Wardrobe
      </Button>
    </Box>
  );
}
