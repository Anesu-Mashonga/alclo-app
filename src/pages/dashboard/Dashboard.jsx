import React, { useState } from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import dayjs from "dayjs";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useWeather } from "../../hooks/useWeather.js";
import { useOutfit } from "../../hooks/useOutfit.js";
import { useWardrobe } from "../../hooks/useWardrobe.js";
import { OCCASIONS, SHOPPING_RECS } from "../../data/seed.js";
import PageContainer from "../../components/common/PageContainer.jsx";
import {
  WeatherContextCard,
  OutfitCard,
  TryOnCard,
  StatsCard,
  ForYouCard,
} from "./DashboardComponents.jsx";
import { DashboardSkeleton } from "../../components/common/Skeletons.jsx";
import "./Dashboard.scss";

export default function Dashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { weather, locationName, loading: weatherLoading } = useWeather();
  const { items: wardrobe, loading: wardrobeLoading, stats } = useWardrobe();
  const [occasion, setOccasion] = useState(
    user?.preferences?.defaultOccasion ?? "casual",
  );

  const {
    outfit,
    loading: outfitLoading,
    accepted,
    generate,
    accept,
  } = useOutfit({
    weather,
    occasion,
    wardrobe,
  });

  const greeting = () => {
    const h = dayjs().hour();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (wardrobeLoading && weatherLoading) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="dashboard">
      {/* Greeting */}
      <Box className="dashboard__greeting">
        <Typography variant={isDesktop ? "h4" : "h5"} fontWeight={800}>
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dayjs().format("dddd, MMMM D, YYYY")}
        </Typography>
      </Box>

      {/* Main grid */}
      <Box
        className={`dashboard__grid ${isDesktop ? "dashboard__grid--desktop" : ""}`}
      >
        {/* Left / Main column */}
        <Box className="dashboard__main">
          <WeatherContextCard
            weather={weather}
            occasion={occasion}
            onOccasionChange={setOccasion}
            locationName={locationName}
          />

          <OutfitCard
            outfit={outfit}
            loading={outfitLoading}
            accepted={accepted}
            onRefresh={generate}
            onAccept={accept}
          />

          {isDesktop && <ForYouCard items={SHOPPING_RECS} />}
        </Box>

        {/* Right / Side column */}
        <Box className="dashboard__side">
          <StatsCard stats={stats} />
          <TryOnCard outfit={outfit} />
          {!isDesktop && <ForYouCard items={SHOPPING_RECS} />}
        </Box>
      </Box>
    </PageContainer>
  );
}
