import { AppBar, Toolbar, Typography, Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";

import "./NavBar.css";

const NavBar = () => {
    const [helpMenuAnchor, setHelpMenuAnchor] = useState(null);
    const [viewsMenuAnchor, setViewsMenuAnchor] = useState(null);

    const openHelpMenu = (event) => setHelpMenuAnchor(event.currentTarget);
    const openViewsMenu = (event) => setViewsMenuAnchor(event.currentTarget);

    const closeHelpMenu = () => setHelpMenuAnchor(null);
    const closeViewsMenu = () => setViewsMenuAnchor(null);

    return (
        <AppBar sx={{  }} position="static" className="navbar">
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }} className="navbar-title">
                    <Link to="/" style={{ textDecoration: "none", color: "white", letterSpacing: "0rem" }}>
                        {import.meta.env.VITE_APP_TITLE}
                    </Link>
                </Typography>
                <Button color="inherit" component={Link} to="/about">About</Button>
                <Button color="inherit" component={Link} to="/datasets">Datasets</Button>
                {/*<Button color="inherit" component={Link} to="/samples">Samples</Button>*/}
                <Button color="inherit" component={Link} to="/views">Views</Button>
                {/*<Button color="inherit" onClick={openViewsMenu}>Views</Button>*/}
                {/*<Menu anchorEl={viewsMenuAnchor} open={Boolean(viewsMenuAnchor)} onClose={closeViewsMenu}>*/}
                {/*    <MenuItem component={Link} to="/views/geneview" onClick={closeViewsMenu}>Genes</MenuItem>*/}
                {/*    <MenuItem component={Link} to="/views/visiumview" onClick={closeViewsMenu}>Visium</MenuItem>*/}
                {/*    <MenuItem component={Link} to="/views/celltypes" onClick={closeViewsMenu}>Celltypes</MenuItem>*/}
                {/*    <MenuItem component={Link} to="/views/layersview" onClick={closeViewsMenu}>Layers</MenuItem>*/}
                {/*    <MenuItem component={Link} to="/views/regionsview" onClick={closeViewsMenu}>Regions</MenuItem>*/}
                {/*    <MenuItem divider />*/}
                {/*    <MenuItem component={Link} to="/views/xcheck" onClick={closeViewsMenu}>XCheck</MenuItem>*/}
                {/*</Menu>*/}

                {/*<Button color="inherit" component={Link} to="/xcheck">XCheck</Button>*/}
                <Button color="inherit" onClick={openHelpMenu}>Help</Button>
                <Menu anchorEl={helpMenuAnchor} open={Boolean(helpMenuAnchor)} onClose={closeHelpMenu}>
                    <MenuItem component={Link} to="/help/howtouse" onClick={closeHelpMenu}>How to Use</MenuItem>
                    <MenuItem component={Link} to="/help/faq" onClick={closeHelpMenu}>FAQ</MenuItem>
                    <MenuItem divider />
                    <MenuItem component={Link} to="/help/restapi" onClick={closeHelpMenu}>REST API</MenuItem>
                </Menu>
                {/*<Button color="inherit" component={Link} to="/login">Login</Button>*/}
            </Toolbar>
        </AppBar>
    );
};

export default NavBar;
