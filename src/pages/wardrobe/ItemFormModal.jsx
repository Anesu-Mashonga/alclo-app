import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import { AddRounded, CloseRounded } from "@mui/icons-material";
import { QUICK_PRESETS } from "../../data/seed.js";
import dayjs from "dayjs";

const TYPES = [
  { value: "top", label: "Top (shirts, tees, sweaters)" },
  { value: "bottom", label: "Bottom (pants, jeans, shorts)" },
  { value: "outer", label: "Outerwear (jackets, coats)" },
  { value: "shoes", label: "Shoes & Footwear" },
  { value: "accessories", label: "Accessories" },
];

const EMPTY_FORM = {
  name: "",
  type: "top",
  categoryLabel: "",
  color: "#5C6BC0",
  imageUrl: "",
  lastWorn: dayjs().format("YYYY-MM-DD"),
  favorite: false,
  tags: [],
};

export default function ItemFormModal({ open, onClose, onSubmit, editItem }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          name: editItem.name,
          type: editItem.type,
          categoryLabel: editItem.categoryLabel ?? "",
          color: editItem.color ?? "#5C6BC0",
          imageUrl: editItem.imageUrl ?? "",
          lastWorn: dayjs(editItem.lastWorn).format("YYYY-MM-DD"),
          favorite: editItem.favorite ?? false,
          tags: editItem.tags ?? [],
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setTagInput("");
    }
  }, [open, editItem]);

  const handleChange = (field) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const applyPreset = (preset) => {
    setForm((f) => ({
      ...f,
      name: preset.name,
      type: preset.type,
      color: preset.color ?? f.color,
      tags: preset.tags ?? [],
    }));
    setErrors({});
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.type) e.type = "Type is required.";
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl)) {
      e.imageUrl = "Must be a valid URL starting with http(s)://";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      ...form,
      lastWorn: new Date(form.lastWorn).toISOString(),
    };
    await onSubmit(payload);
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {editItem ? "Edit Item" : "Add New Item"}
        <IconButton onClick={onClose} size="small" aria-label="Close dialog">
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Quick presets */}
        {!editItem && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Quick presets
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {QUICK_PRESETS.map((p) => (
                <Chip
                  key={p.name}
                  label={p.name}
                  onClick={() => applyPreset(p)}
                  size="small"
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Item name"
            value={form.name}
            onChange={handleChange("name")}
            error={!!errors.name}
            helperText={errors.name}
            required
            placeholder="e.g. White Oxford Shirt"
          />

          <FormControl fullWidth error={!!errors.type} required>
            <InputLabel>Type</InputLabel>
            <Select
              value={form.type}
              onChange={handleChange("type")}
              label="Type"
            >
              {TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Category label (optional)"
            value={form.categoryLabel}
            onChange={handleChange("categoryLabel")}
            placeholder="e.g. Hoodie, Chinos, Loafers"
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Color"
              type="color"
              value={form.color}
              onChange={handleChange("color")}
              sx={{
                width: 100,
                "& input": {
                  height: 40,
                  cursor: "pointer",
                  padding: "2px 4px",
                },
              }}
              inputProps={{ "aria-label": "Choose item color" }}
            />
            <TextField
              fullWidth
              label="Image URL (optional)"
              value={form.imageUrl}
              onChange={handleChange("imageUrl")}
              error={!!errors.imageUrl}
              helperText={errors.imageUrl || "Link to a product or photo image"}
            />
          </Box>

          <TextField
            fullWidth
            label="Last worn"
            type="date"
            value={form.lastWorn}
            onChange={handleChange("lastWorn")}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: dayjs().format("YYYY-MM-DD") }}
          />

          {/* Tags */}
          <Box>
            <TextField
              fullWidth
              label="Add tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="e.g. casual, work, summer — press Enter"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={addTag}
                      size="small"
                      aria-label="Add tag"
                    >
                      <AddRounded />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {form.tags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                {form.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => removeTag(tag)}
                  />
                ))}
              </Box>
            )}
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={form.favorite}
                onChange={(e) =>
                  setForm((f) => ({ ...f, favorite: e.target.checked }))
                }
              />
            }
            label="Mark as favorite ⭐"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : editItem ? (
            "Save Changes"
          ) : (
            "Add Item"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
