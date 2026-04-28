import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Chip,
  InputAdornment,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { AddRounded, SearchRounded } from "@mui/icons-material";
import { useWardrobe } from "../../hooks/useWardrobe.js";
import PageContainer from "../../components/common/PageContainer.jsx";
import WardrobeItemCard from "./WardrobeItemCard.jsx";
import ItemFormModal from "./ItemFormModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { WardrobeGridSkeleton } from "../../components/common/Skeletons.jsx";
import "./Wardrobe.scss";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "outer", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

export default function Wardrobe() {
  const { items, loading, createItem, updateItem, deleteItem, toggleFavorite } =
    useWardrobe();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          (i.categoryLabel ?? "").toLowerCase().includes(q) ||
          (i.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((i) => i.type === typeFilter);
    }

    if (sortBy === "newest")
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === "name")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "worn")
      result.sort((a, b) => new Date(b.lastWorn) - new Date(a.lastWorn));
    else if (sortBy === "favorites")
      result.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

    return result;
  }, [items, search, typeFilter, sortBy]);

  const handleEdit = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleFormSubmit = async (payload) => {
    if (editItem) {
      await updateItem(editItem.id, payload);
      setEditItem(null);
    } else {
      await createItem(payload);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  return (
    <PageContainer
      title="My Wardrobe"
      subtitle={`${items.length} item${items.length !== 1 ? "s" : ""} in your wardrobe`}
      actions={
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => {
            setEditItem(null);
            setModalOpen(true);
          }}
          aria-label="Add new wardrobe item"
        >
          Add Item
        </Button>
      }
    >
      {/* Search + Filter row */}
      <Box className="wardrobe-filters">
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, type, tag…"
          size="small"
          className="wardrobe-filters__search"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          aria-label="Search wardrobe items"
        />

        <Box className="wardrobe-filters__chips">
          {TYPE_FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              onClick={() => setTypeFilter(f.value)}
              color={typeFilter === f.value ? "primary" : "default"}
              variant={typeFilter === f.value ? "filled" : "outlined"}
              size="small"
              clickable
            />
          ))}
        </Box>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sort"
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="name">Name A–Z</MenuItem>
            <MenuItem value="worn">Last Worn</MenuItem>
            <MenuItem value="favorites">Favorites First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Grid */}
      {loading ? (
        <WardrobeGridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="👗"
          title="Your wardrobe is empty"
          description="Start building your wardrobe by adding your first item."
          action={() => setModalOpen(true)}
          actionLabel="Add First Item"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No items match your search"
          description="Try adjusting your search or filters."
          action={() => {
            setSearch("");
            setTypeFilter("all");
          }}
          actionLabel="Clear Filters"
        />
      ) : (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            {search || typeFilter !== "all" ? " matching filters" : ""}
          </Typography>
          <Box className="wardrobe-grid">
            {filtered.map((item) => (
              <WardrobeItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </Box>
        </>
      )}

      {/* Add/Edit Modal */}
      <ItemFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        editItem={editItem}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete item?"
        message={`Remove "${deleteTarget?.name}" from your wardrobe? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        confirmColor="error"
      />
    </PageContainer>
  );
}
