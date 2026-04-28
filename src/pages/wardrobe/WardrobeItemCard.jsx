import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FavoriteRounded,
  FavoriteBorderRounded,
  EditRounded,
  DeleteRounded,
} from "@mui/icons-material";
import "./Wardrobe.scss";

const TYPE_COLORS = {
  top: "#5C6BC0",
  bottom: "#26A69A",
  outer: "#EF5350",
  shoes: "#FFA726",
  accessories: "#AB47BC",
};

export default function WardrobeItemCard({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
}) {
  return (
    <Card className="wardrobe-card" elevation={0}>
      <Box className="wardrobe-card__img-wrap">
        {item.imageUrl ? (
          <CardMedia
            component="img"
            image={item.imageUrl}
            alt={item.name}
            className="wardrobe-card__img"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.querySelector(
                ".wardrobe-card__img-fallback",
              ).style.display = "flex";
            }}
          />
        ) : null}
        <Box
          className="wardrobe-card__img-fallback"
          style={{ display: item.imageUrl ? "none" : "flex" }}
        >
          👕
        </Box>
        {/* Color dot */}
        <Box
          className="wardrobe-card__color-dot"
          style={{ backgroundColor: item.color }}
          aria-label={`Color: ${item.color}`}
        />
        {/* Type badge */}
        <Chip
          label={item.type}
          size="small"
          className="wardrobe-card__type-badge"
          style={{
            backgroundColor: TYPE_COLORS[item.type] ?? "#9E9E9E",
            color: "#fff",
          }}
        />
        {/* Laundry badge */}
        {item.inLaundry && (
          <Chip
            label="🧺 Laundry"
            size="small"
            className="wardrobe-card__laundry-badge"
            color="warning"
          />
        )}
      </Box>

      <CardContent className="wardrobe-card__content">
        <Typography
          variant="subtitle2"
          fontWeight={600}
          noWrap
          title={item.name}
        >
          {item.name}
        </Typography>
        {item.categoryLabel && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {item.categoryLabel}
          </Typography>
        )}
      </CardContent>

      <CardActions className="wardrobe-card__actions" disableSpacing>
        <Tooltip
          title={item.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <IconButton
            size="small"
            onClick={() => onToggleFavorite(item.id)}
            aria-label={
              item.favorite ? "Remove from favorites" : "Add to favorites"
            }
            color={item.favorite ? "warning" : "default"}
          >
            {item.favorite ? (
              <FavoriteRounded fontSize="small" />
            ) : (
              <FavoriteBorderRounded fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Edit item">
          <IconButton
            size="small"
            onClick={() => onEdit(item)}
            aria-label="Edit item"
          >
            <EditRounded fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete item">
          <IconButton
            size="small"
            onClick={() => onDelete(item)}
            aria-label="Delete item"
            color="error"
          >
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
