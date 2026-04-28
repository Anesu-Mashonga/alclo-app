import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

const SnackbarContext = createContext(null);

export function SnackbarProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const show = useCallback(
    (message, severity = "success", duration = 4000) => {
      const id = Date.now();
      setQueue((prev) => [...prev, { id, message, severity, duration }]);
      if (!open) {
        setCurrent({ id, message, severity, duration });
        setOpen(true);
      }
    },
    [open],
  );

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleExited = () => {
    setQueue((prev) => {
      const next = prev.slice(1);
      if (next.length > 0) {
        setCurrent(next[0]);
        setOpen(true);
      } else {
        setCurrent(null);
      }
      return next;
    });
  };

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      {current && (
        <Snackbar
          key={current.id}
          open={open}
          autoHideDuration={current.duration}
          onClose={handleClose}
          TransitionProps={{ onExited: handleExited }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleClose}
            severity={current.severity}
            variant="filled"
            sx={{ width: "100%", borderRadius: 3 }}
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used inside SnackbarProvider");
  return ctx;
};
