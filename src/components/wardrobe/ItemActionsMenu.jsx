import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import CleaningServicesOutlined from '@mui/icons-material/CleaningServicesOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';
import { useUI } from '@/context/UIContext';
import { isWashable } from '@/lib/laundry';
import './ItemActionsMenu.scss';

/**
 * Overflow menu for one item (list rows): open, edit, favourite, wear today,
 * the contextual laundry move and delete. Actions come from useItemActions.
 */
export default function ItemActionsMenu({ item, actions, onOpen, className }) {
  const ui = useUI();
  const [anchor, setAnchor] = useState(null);
  const menuId = useId();
  const open = Boolean(anchor);
  const washable = isWashable(item);
  const clean = (item.laundry?.status ?? 'clean') === 'clean';

  const close = () => setAnchor(null);
  const run = (fn) => () => {
    close();
    fn();
  };

  return (
    <>
      <Tooltip title="More actions">
        <IconButton
          className={className}
          aria-label={`More actions for ${item.name}`}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          aria-expanded={open || undefined}
          onClick={(event) => {
            event.stopPropagation();
            setAnchor(event.currentTarget);
          }}
        >
          <MoreHorizOutlined />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        className="item-actions-menu"
      >
        <MenuItem onClick={run(() => onOpen?.(item))}>
          <ListItemIcon>
            <OpenInNewOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open details</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => ui.openItemForm({ mode: 'edit', itemId: item.id }))}>
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => actions.toggleFavorite(item))}>
          <ListItemIcon>
            {item.favorite ? <Favorite fontSize="small" /> : <FavoriteBorderOutlined fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{item.favorite ? 'Remove from favourites' : 'Add to favourites'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(() => actions.wearToday(item))}>
          <ListItemIcon>
            <CheckroomOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Wear today</ListItemText>
        </MenuItem>
        {washable && clean ? (
          <MenuItem onClick={run(() => actions.sendToLaundry(item))}>
            <ListItemIcon>
              <LocalLaundryServiceOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send to laundry</ListItemText>
          </MenuItem>
        ) : null}
        {washable && !clean ? (
          <MenuItem onClick={run(() => actions.markClean(item))}>
            <ListItemIcon>
              <CleaningServicesOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark clean</ListItemText>
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem className="item-actions-menu__danger" onClick={run(() => actions.deleteItems(item))}>
          <ListItemIcon>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
