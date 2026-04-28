import React from "react";
import { Box, Typography } from "@mui/material";
import "./PageContainer.scss";

export default function PageContainer({
  title,
  subtitle,
  actions,
  children,
  className = "",
}) {
  return (
    <Box className={`page-container ${className}`}>
      {(title || actions) && (
        <Box className="page-container__header">
          <Box>
            {title && (
              <Typography variant="h5" fontWeight={700}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box className="page-container__actions">{actions}</Box>}
        </Box>
      )}
      {children}
    </Box>
  );
}
