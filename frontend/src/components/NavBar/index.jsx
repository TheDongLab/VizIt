import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Menu,
    MenuItem,
    IconButton,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Divider,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {useState} from "react";
import {Link} from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import "./NavBar.css";

const NavBar = () => {
    const [helpMenuAnchor, setHelpMenuAnchor] = useState(null);
    const [viewsMenuAnchor, setViewsMenuAnchor] = useState(null);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const openHelpMenu = (event) => setHelpMenuAnchor(event.currentTarget);
    const openViewsMenu = (event) => setViewsMenuAnchor(event.currentTarget);

    const closeHelpMenu = () => setHelpMenuAnchor(null);
    const closeViewsMenu = () => setViewsMenuAnchor(null);

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setMobileDrawerOpen(open);
    };

    // Drawer content for mobile view
    const drawerContent = (
        <Box
            sx={{width: 250}}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <Box sx={{display: 'flex', justifyContent: 'flex-end', p: 1}}>
                <IconButton onClick={toggleDrawer(false)}>
                    <CloseIcon/>
                </IconButton>
            </Box>
            <Divider/>
            <List>
                <ListItem button component={Link} to="/about">
                    <ListItemText primary="About"/>
                </ListItem>
                <ListItem button component={Link} to="/datasets">
                    <ListItemText primary="Datasets"/>
                </ListItem>
                <ListItem button component={Link} to="/views">
                    <ListItemText primary="Views"/>
                </ListItem>
                <ListItem button onClick={openHelpMenu}>
                    <ListItemText primary="Help"/>
                </ListItem>
            </List>
            <Divider/>
            <List>
                <ListItem button component={Link} to="/help/howtouse">
                    <ListItemText primary="How to Use"/>
                </ListItem>
                <ListItem button component={Link} to="/help/faq">
                    <ListItemText primary="FAQ"/>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="static" className="navbar">
                <Toolbar>
                    <Typography variant="h6" sx={{flexGrow: 1}} className="navbar-title">
                        <Link to="/" style={{textDecoration: "none", color: "white", letterSpacing: "0rem"}}>
                            {import.meta.env.VITE_APP_TITLE}
                        </Link>
                    </Typography>

                    {isMobile ? (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={toggleDrawer(true)}
                        >
                            <MenuIcon/>
                        </IconButton>
                    ) : (
                        <>
                            <Button color="inherit" component={Link} to="/about">About</Button>
                            <Button color="inherit" component={Link} to="/datasets">Datasets</Button>
                            <Button color="inherit" component={Link} to="/views">Views</Button>
                            <Button color="inherit" onClick={openHelpMenu}>Help</Button>
                            <Menu anchorEl={helpMenuAnchor} open={Boolean(helpMenuAnchor)} onClose={closeHelpMenu}>
                                <MenuItem component={Link} to="/help/howtouse" onClick={closeHelpMenu}>How to
                                    Use</MenuItem>
                                <MenuItem component={Link} to="/help/faq" onClick={closeHelpMenu}>FAQ</MenuItem>
                            </Menu>
                        </>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="right"
                open={mobileDrawerOpen}
                onClose={toggleDrawer(false)}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default NavBar;