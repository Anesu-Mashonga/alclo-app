import React from "react";
import { Box, Typography, Button } from "@mui/material";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 8,
        px: 2,
        gap: 2,
      }}
    >
      {icon && <Box sx={{ fontSize: 64, lineHeight: 1, mb: 1 }}>{icon}</Box>}
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320 }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
