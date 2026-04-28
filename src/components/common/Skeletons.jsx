import React from "react";
import { Box, Skeleton, Card, CardContent } from "@mui/material";

export function CardSkeleton({ height = 200 }) {
  return (
    <Card>
      <Skeleton variant="rectangular" height={height} />
      <CardContent>
        <Skeleton width="60%" height={24} />
        <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={72} />
      ))}
    </Box>
  );
}

export function WardrobeGridSkeleton({ count = 6 }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} height={220} />
      ))}
    </Box>
  );
}

export function DashboardSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={200} />
      <Skeleton variant="rounded" height={160} />
    </Box>
  );
}
