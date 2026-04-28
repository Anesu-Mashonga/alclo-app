import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  SearchRounded,
  CheckCircleRounded,
  CloseRounded,
  DoneAllRounded,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useWardrobe } from "../../hooks/useWardrobe.js";
import { laundryService } from "../../services/laundryService.js";
import PageContainer from "../../components/common/PageContainer.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { ListSkeleton } from "../../components/common/Skeletons.jsx";
import "./Laundry.scss";

dayjs.extend(relativeTime);

const FILTER_CHIPS = [
  { value: "all", label: "All Dirty" },
  { value: "urgent", label: "🚨 Urgent" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
  { value: "outer", label: "Outerwear" },
];

export default function Laundry() {
  const { items, loading, markItemsClean, stats } = useWardrobe();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date");
  const [statsVisible, setStatsVisible] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      laundryService.getLaundryStats(items).then((res) => {
        if (res.success) setStatsData(res.data);
      });
    }
  }, [items, loading]);

  const dirtyItems = useMemo(() => {
    if (loading) return [];
    return laundryService.filterAndSort(
      items.filter(
        (i) => i.inLaundry || dayjs().diff(dayjs(i.lastWorn), "hour") >= 16,
      ),
      { search, filter, sort },
    );
  }, [items, search, filter, sort, loading]);

  const handleMarkClean = async (id) => {
    await markItemsClean([id]);
  };

  const handleBulkClean = async () => {
    const ids = dirtyItems.map((i) => i.id);
    if (ids.length > 0) await markItemsClean(ids);
    setBulkConfirmOpen(false);
  };

  const getUrgency = (item) => {
    const hours = dayjs().diff(dayjs(item.lastWorn), "hour");
    return hours >= 48 ? "urgent" : "normal";
  };

  return (
    <PageContainer
      title="Laundry Tracker"
      subtitle="Track and manage items that need washing"
    >
      {/* Status Panel */}
      {statsVisible && statsData && (
        <Card className="laundry-stats-card" elevation={0}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ flex: 1, mr: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {statsData.dirtyItems} of {statsData.totalItems} items need
                    washing
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={
                      statsData.dirtyPercentage > 60
                        ? "error.main"
                        : "primary.main"
                    }
                  >
                    {statsData.dirtyPercentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={statsData.dirtyPercentage}
                  color={
                    statsData.dirtyPercentage > 60
                      ? "error"
                      : statsData.dirtyPercentage > 30
                        ? "warning"
                        : "success"
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {statsData.urgentItems > 0
                    ? `⚠️ ${statsData.urgentItems} item${statsData.urgentItems > 1 ? "s" : ""} urgently need washing`
                    : statsData.dirtyPercentage === 0
                      ? "✅ All items are clean!"
                      : "👍 Laundry situation is manageable"}
                </Typography>
              </Box>
              <Tooltip title="Dismiss panel">
                <IconButton
                  size="small"
                  onClick={() => setStatsVisible(false)}
                  aria-label="Dismiss stats panel"
                >
                  <CloseRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      )}

      {!statsVisible && (
        <Button
          size="small"
          variant="text"
          onClick={() => setStatsVisible(true)}
          sx={{ mb: 2 }}
        >
          Show laundry status
        </Button>
      )}

      {/* Controls */}
      <Box className="laundry-controls">
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dirty items…"
          size="small"
          className="laundry-controls__search"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Box className="laundry-controls__filter-row">
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, flex: 1 }}>
            {FILTER_CHIPS.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                onClick={() => setFilter(c.value)}
                color={filter === c.value ? "primary" : "default"}
                variant={filter === c.value ? "filled" : "outlined"}
                size="small"
                clickable
              />
            ))}
          </Box>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              label="Sort"
            >
              <MenuItem value="date">Latest</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Bulk Action */}
      {dirtyItems.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DoneAllRounded />}
            onClick={() => setBulkConfirmOpen(true)}
            size="small"
          >
            Mark All {filter !== "all" ? `(${filter})` : ""} Clean (
            {dirtyItems.length})
          </Button>
        </Box>
      )}

      {/* List */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : dirtyItems.length === 0 ? (
        <EmptyState
          icon="✨"
          title={
            search || filter !== "all" ? "No matching items" : "All clean!"
          }
          description={
            search || filter !== "all"
              ? "Try adjusting your filters."
              : "No items need washing right now. Great wardrobe hygiene!"
          }
          action={
            search || filter !== "all"
              ? () => {
                  setSearch("");
                  setFilter("all");
                }
              : null
          }
          actionLabel="Clear Filters"
        />
      ) : (
        <Box className="laundry-list">
          {dirtyItems.map((item) => {
            const urgency = getUrgency(item);
            const hours = dayjs().diff(dayjs(item.lastWorn), "hour");
            return (
              <Card
                key={item.id}
                className={`laundry-item ${urgency === "urgent" ? "laundry-item--urgent" : ""}`}
                elevation={0}
              >
                <CardContent className="laundry-item__content">
                  <Avatar
                    src={item.imageUrl}
                    alt={item.name}
                    variant="rounded"
                    sx={{ width: 56, height: 56 }}
                  >
                    {item.name[0]}
                  </Avatar>
                  <Box className="laundry-item__info">
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.name}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                        mt: 0.25,
                      }}
                    >
                      <Chip label={item.type} size="small" variant="outlined" />
                      <Chip
                        label={
                          urgency === "urgent" ? "🚨 Urgent" : "🧺 Needs wash"
                        }
                        size="small"
                        color={urgency === "urgent" ? "error" : "warning"}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Last worn {dayjs(item.lastWorn).fromNow()} ({hours}h ago)
                    </Typography>
                  </Box>
                  <Box sx={{ ml: "auto", flexShrink: 0 }}>
                    <Tooltip title="Mark as clean">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleRounded fontSize="small" />}
                        onClick={() => handleMarkClean(item.id)}
                      >
                        Clean
                      </Button>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Mark all as clean?"
        message={`This will mark ${dirtyItems.length} item${dirtyItems.length > 1 ? "s" : ""} as clean. Are you sure?`}
        onConfirm={handleBulkClean}
        onCancel={() => setBulkConfirmOpen(false)}
        confirmLabel="Mark All Clean"
        confirmColor="success"
      />
    </PageContainer>
  );
}
