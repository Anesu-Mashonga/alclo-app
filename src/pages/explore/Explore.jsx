import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Grid,
  Divider,
} from "@mui/material";
import { RefreshRounded } from "@mui/icons-material";
import { outfitService } from "../../services/outfitService.js";
import { useWardrobe } from "../../hooks/useWardrobe.js";
import { useWeather } from "../../hooks/useWeather.js";
import { OCCASIONS } from "../../data/seed.js";
import PageContainer from "../../components/common/PageContainer.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import "./Explore.scss";

const TYPE_EMOJI = {
  top: "👕",
  bottom: "👖",
  outer: "🧥",
  shoes: "👟",
  accessories: "💍",
};

function OutfitSuggestionCard({ occasion, outfit, loading, onRegenerate }) {
  return (
    <Card className="explore-card" elevation={0}>
      <CardContent className="explore-card__content">
        <Box className="explore-card__header">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "1.5rem" }}>{occasion.icon}</Typography>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {occasion.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Outfit suggestion
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<RefreshRounded fontSize="small" />}
            onClick={onRegenerate}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : !outfit ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 2, textAlign: "center" }}
          >
            Not enough wardrobe items for this occasion. Add more items!
          </Typography>
        ) : (
          <>
            <Box className="explore-card__items">
              {outfit.items.map((item) => (
                <Box key={item.id} className="explore-card__item">
                  <Box className="explore-card__item-icon">
                    {TYPE_EMOJI[item.type] ?? "👔"}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.type}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.name}
                    </Typography>
                  </Box>
                  <Box
                    className="explore-card__color"
                    style={{ backgroundColor: item.color }}
                    title={item.color}
                  />
                </Box>
              ))}
            </Box>
            {outfit.reason && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1.5, display: "block", fontStyle: "italic" }}
              >
                💡 {outfit.reason}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Explore() {
  const { items: wardrobe } = useWardrobe();
  const { weather } = useWeather();
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [outfits, setOutfits] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const generateForOccasion = async (occasionValue) => {
    setLoadingMap((prev) => ({ ...prev, [occasionValue]: true }));
    const res = await outfitService.generateForOccasion({
      occasion: occasionValue,
      wardrobe,
      weather,
    });
    setOutfits((prev) => ({
      ...prev,
      [occasionValue]: res.success ? res.data.outfit : null,
    }));
    setLoadingMap((prev) => ({ ...prev, [occasionValue]: false }));
  };

  // Generate for selected occasion initially
  useEffect(() => {
    if (!wardrobe || wardrobe.length === 0 || !weather) return;
    const toGenerate = selectedOccasion
      ? [selectedOccasion]
      : OCCASIONS.map((o) => o.value);
    toGenerate.forEach((occ) => {
      if (!outfits[occ]) generateForOccasion(occ);
    });
  }, [wardrobe, weather, selectedOccasion]); // eslint-disable-line

  const displayedOccasions = selectedOccasion
    ? OCCASIONS.filter((o) => o.value === selectedOccasion)
    : OCCASIONS;

  return (
    <PageContainer
      title="Explore Outfits"
      subtitle="Get outfit ideas for every occasion"
    >
      {/* Occasion tabs */}
      <Box className="explore-occasion-tabs">
        <Chip
          label="All Occasions"
          onClick={() => setSelectedOccasion(null)}
          color={!selectedOccasion ? "primary" : "default"}
          variant={!selectedOccasion ? "filled" : "outlined"}
          clickable
        />
        {OCCASIONS.map((o) => (
          <Chip
            key={o.value}
            label={`${o.icon} ${o.label}`}
            onClick={() =>
              setSelectedOccasion(o.value === selectedOccasion ? null : o.value)
            }
            color={selectedOccasion === o.value ? "primary" : "default"}
            variant={selectedOccasion === o.value ? "filled" : "outlined"}
            clickable
          />
        ))}
      </Box>

      {wardrobe.length === 0 ? (
        <EmptyState
          icon="👗"
          title="Wardrobe is empty"
          description="Add items to your wardrobe to get outfit suggestions for every occasion."
        />
      ) : (
        <Grid container spacing={2}>
          {displayedOccasions.map((occasion) => (
            <Grid item xs={12} sm={6} lg={4} key={occasion.value}>
              <OutfitSuggestionCard
                occasion={occasion}
                outfit={outfits[occasion.value]}
                loading={!!loadingMap[occasion.value]}
                onRegenerate={() => generateForOccasion(occasion.value)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
}
