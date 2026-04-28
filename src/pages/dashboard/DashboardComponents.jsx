import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import {
  RefreshRounded,
  CheckCircleRounded,
  WbSunnyRounded,
  AcUnitRounded,
  GrainRounded,
  CloudRounded,
  ThunderstormRounded,
} from "@mui/icons-material";
import { OCCASIONS } from "../../data/seed.js";
import "./Dashboard.scss";

// ─── Weather Card ─────────────────────────────────────────────────────────────
export function WeatherContextCard({
  weather,
  occasion,
  onOccasionChange,
  locationName,
}) {
  return (
    <Card className="context-card" elevation={0}>
      <CardContent className="context-card__content">
        <Box className="context-card__weather">
          <Box className="weather-icon">{weather?.icon ?? "🌤️"}</Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {weather?.tempC !== undefined ? `${weather.tempC}°C` : "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weather?.label ?? "Loading..."} · {locationName}
            </Typography>
          </Box>
        </Box>
        <Box className="context-card__occasion">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            Occasion
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {OCCASIONS.map((o) => (
              <Chip
                key={o.value}
                label={`${o.icon} ${o.label}`}
                onClick={() => onOccasionChange(o.value)}
                color={occasion === o.value ? "primary" : "default"}
                variant={occasion === o.value ? "filled" : "outlined"}
                size="small"
                className="occasion-chip"
              />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Item Quick Popover ───────────────────────────────────────────────────────
function ItemDetailDialog({ item, onClose }) {
  if (!item) return null;
  return (
    <Dialog open={!!item} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{item.name}</DialogTitle>
      <DialogContent>
        {item.imageUrl && (
          <Box
            component="img"
            src={item.imageUrl}
            alt={item.name}
            sx={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              borderRadius: 2,
              mb: 2,
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
          <Chip
            label={item.type}
            size="small"
            color="primary"
            variant="outlined"
          />
          {item.categoryLabel && (
            <Chip label={item.categoryLabel} size="small" />
          )}
          {item.favorite && (
            <Chip label="⭐ Favorite" size="small" color="warning" />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: item.color,
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {item.color}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Outfit of the Day Card ───────────────────────────────────────────────────
export function OutfitCard({ outfit, loading, accepted, onRefresh, onAccept }) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) {
    return (
      <Card className="outfit-card" elevation={0}>
        <CardContent>
          <Skeleton width={180} height={28} />
          <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" width={90} height={110} />
            ))}
          </Box>
          <Skeleton width="70%" height={20} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!outfit) {
    return (
      <Card className="outfit-card" elevation={0}>
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          <Typography variant="h2" sx={{ mb: 1 }}>
            👗
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            No outfit available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add more items to your wardrobe to get recommendations.
          </Typography>
          <Button
            variant="outlined"
            onClick={onRefresh}
            startIcon={<RefreshRounded />}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="outfit-card" elevation={0}>
        <CardContent className="outfit-card__content">
          <Box className="outfit-card__header">
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Outfit of the Day
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {outfit.occasion.charAt(0).toUpperCase() +
                  outfit.occasion.slice(1)}{" "}
                · Click items for details
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Regenerate outfit">
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={onRefresh}
                  startIcon={<RefreshRounded fontSize="small" />}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Tooltip>
              {!accepted && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={onAccept}
                  startIcon={<CheckCircleRounded fontSize="small" />}
                >
                  Accept
                </Button>
              )}
              {accepted && (
                <Chip
                  label="✓ Accepted"
                  color="success"
                  size="small"
                  icon={<CheckCircleRounded />}
                />
              )}
            </Box>
          </Box>

          <Box className="outfit-items">
            {outfit.items.map((item) => (
              <Tooltip key={item.id} title={`${item.name} — click for details`}>
                <Box
                  className="outfit-item"
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedItem(item)}
                  aria-label={`View details for ${item.name}`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="outfit-item__img"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <Box className="outfit-item__fallback">👔</Box>
                  )}
                  <Typography
                    variant="caption"
                    className="outfit-item__label"
                    noWrap
                  >
                    {item.name}
                  </Typography>
                  <Chip
                    label={item.type}
                    size="small"
                    className="outfit-item__type"
                  />
                </Box>
              </Tooltip>
            ))}
          </Box>

          {outfit.reason && (
            <Typography
              variant="body2"
              color="text.secondary"
              className="outfit-reason"
            >
              💡 {outfit.reason}
            </Typography>
          )}
        </CardContent>
      </Card>

      <ItemDetailDialog
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}

// ─── Virtual Try-On Card ──────────────────────────────────────────────────────
export function TryOnCard({ outfit }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="tryon-card" elevation={0}>
        <CardContent className="tryon-card__content">
          <Box className="tryon-card__text">
            <Typography variant="h6" fontWeight={700}>
              Virtual Try-On
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              See how your outfit looks before you wear it
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => setModalOpen(true)}
              disabled={!outfit}
            >
              Try Outfit
            </Button>
          </Box>
          <Box className="tryon-card__visual">
            <Box className="tryon-avatar">
              <Typography sx={{ fontSize: 64 }}>🧍</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Virtual Try-On — Coming Soon</DialogTitle>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <Typography sx={{ fontSize: 72, mb: 2 }}>🪄</Typography>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            This feature is in development
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Virtual try-on uses AR/ML to overlay selected outfit items onto a
            body model. Integration with a real-time rendering API is planned
            for a future release.
          </Typography>
          {outfit && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Queued outfit:
              </Typography>
              {outfit.items.map((i) => (
                <Typography key={i.id} variant="body2" color="text.secondary">
                  • {i.name} ({i.type})
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} variant="contained">
            Got It
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
export function StatsCard({ stats }) {
  const statItems = [
    { label: "Total Items", value: stats.total, emoji: "👕" },
    { label: "Worn This Week", value: stats.wornThisWeek, emoji: "📅" },
    { label: "In Laundry", value: stats.inLaundry, emoji: "🧺" },
    { label: "Favorites", value: stats.favorites, emoji: "⭐" },
  ];

  return (
    <Card className="stats-card" elevation={0}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Wardrobe Overview
        </Typography>
        <Grid container spacing={2}>
          {statItems.map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Box className="stat-item">
                <Typography className="stat-item__emoji">{s.emoji}</Typography>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  className="stat-item__value"
                >
                  {s.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── For You Card ─────────────────────────────────────────────────────────────
export function ForYouCard({ items }) {
  return (
    <Card className="for-you-card" elevation={0}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            For You
          </Typography>
          <Button size="small" color="primary">
            Shop All
          </Button>
        </Box>
        <Box className="for-you-grid">
          {items.map((item) => (
            <Box key={item.id} className="for-you-item">
              <Box className="for-you-item__img-wrap">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="for-you-item__img"
                    onError={(e) => {
                      e.target.parentNode.style.display = "none";
                    }}
                  />
                )}
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="secondary"
                    className="for-you-item__badge"
                  />
                )}
              </Box>
              <Box className="for-you-item__info">
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.brand}
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight={700}>
                  ${item.price.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
