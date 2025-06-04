import { useState } from "react";
import { Box, Button, ButtonGroup } from "@mui/material";
import "./BrainsideSelector.css";
import RegionStore from "../../store/RegionStore.js";

const BrainsideSelector = () => {
    const [selectedSide, setSelectedSide] = useState("outer");

    const {region, assays, setSide, setRegion } = RegionStore();

    const handleSideChange = (newSide) => {
        setSelectedSide(newSide);
        setSide(newSide);
        setRegion(newSide, region, assays);
    };

    const sideTypes = {
        "outer": "Outermost",
        "inner": "Innermost",
    };

    return (
        <Box className="side-selector">
            <ButtonGroup variant="outlined" className="side-buttons">
                {Object.keys(sideTypes).map((side) => (
                    <Button
                        key={side}
                        onClick={() => handleSideChange(side)}
                        className={selectedSide === side ? "selected" : ""}
                    >
                        {sideTypes[side]}
                    </Button>
                ))}
            </ButtonGroup>
        </Box>
    );
};

export default BrainsideSelector;

