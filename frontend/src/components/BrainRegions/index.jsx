import {useState} from "react";
import useHomeStore from "../../store/HomeStore.js";

import * as brainRegions_inner from "../../assets/images/brain_inner";
import * as brainRegions_outer from "../../assets/images/brain_outer";

import "./BrainRegions.css";
import {useNavigate} from "react-router-dom";
import PropTypes from "prop-types";
import StatBar from "../StatBar/index.jsx";

const brainRegions = {
    // Outermost regions
    outer: {
        default: brainRegions_outer.Brain5_Color, // Default brain image
        frontalLobe: brainRegions_outer.Brain5_FrontalLobe,
        parietalLobe: brainRegions_outer.Brain5_ParietalLobe,
        occipitalLobe: brainRegions_outer.Brain5_OccipitalLobe,
        temporalLobe: brainRegions_outer.Brain5_TemporalLobe,
        regionPoints: brainRegions_outer.regionPaths,
    },

    // Inner regions
    inner: {
        default: brainRegions_inner.Brain5I_Color,
        frontalLobe: brainRegions_inner.Brain5I_FrontalLobe,
        parietalLobe: brainRegions_inner.Brain5I_ParietalLobe,
        occipitalLobe: brainRegions_inner.Brain5I_OccipitalLobe,
        temporalLobe: brainRegions_inner.Brain5I_TemporalLobe,
        regionPoints: brainRegions_inner.regionPaths,
    }
};


const BrainRegions = ({disease}) => {
    const {side, region, setSide, setRegion} = useHomeStore();
    const navigate = useNavigate();

    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [clickedRegion, setClickedRegion] = useState(null);

    const default_outer = {
        name: "Default_outer",
        side: "outer",
        image: brainRegions.outer.default,
        assays: ["Assay 1", "Assay 2", "Assay 3"],
        points: "",
    }
    const default_inner = {
        name: "Default_inner (Inner)",
        side: "inner",
        image: brainRegions.inner.default,
        assays: ["Assay 1", "Assay 2", "Assay 3"],
        points: "",
    }

    const regions = {
        frontalLobe_outer: {
            name: "Frontal lobe",
            side: "outer",
            image: brainRegions.outer.frontalLobe,
            assays: ["Assay 1", "Assay 2", "Assay 4"],
            points: brainRegions.outer.regionPoints.FrontalLobe,
        },
        parietalLobe_outer: {
            name: "Parietal lobe",
            side: "outer",
            image: brainRegions.outer.parietalLobe,
            assays: ["Assay A", "Assay B"],
            points: brainRegions.outer.regionPoints.ParietalLobe,
        },
        occipitalLobe_outer: {
            name: "Occipital lobe",
            side: "outer",
            image: brainRegions.outer.occipitalLobe,
            assays: ["Assay C", "Assay D"],
            points: brainRegions.outer.regionPoints.OccipitalLobe,
        },
        temporalLobe_outer: {
            name: "Temporal lobe",
            side: "outer",
            image: brainRegions.outer.temporalLobe,
            assays: ["Assay E", "Assay F"],
            points: brainRegions.outer.regionPoints.TemporalLobe,
        },

        frontalLobe_inner: {
            name: "Frontal lobe",
            side: "inner",
            image: brainRegions.inner.frontalLobe,
            assays: ["Assay 1", "Assay 2", "Assay 4"],
            points: brainRegions.inner.regionPoints.FrontalLobe,
        },
        parietalLobe_inner: {
            name: "Parietal lobe",
            side: "inner",
            image: brainRegions.inner.parietalLobe,
            assays: ["Assay A", "Assay B"],
            points: brainRegions.inner.regionPoints.ParietalLobe,
        },
        occipitalLobe_inner: {
            name: "Occipital lobe",
            side: "inner",
            image: brainRegions.inner.occipitalLobe,
            assays: ["Assay C", "Assay D"],
            points: brainRegions.inner.regionPoints.OccipitalLobe,
        },
        temporalLobe_inner: {
            name: "Temporal lobe",
            side: "inner",
            image: brainRegions.inner.temporalLobe,
            assays: ["Assay E", "Assay F"],
            points: brainRegions.inner.regionPoints.TemporalLobe,
        },
    };

    const handleHover = (region) => {
        setHoveredRegion(region);
    };

    const handleClick = (region) => {
        setClickedRegion(region);
        // alert(`Region: ${region.name}`);
        // 👇 navigate to a dataset page for the selected region
        navigate(`/datasets?disease=${disease}&brainRegion=${region.name}`); // or region.name, slug, etc.

    };

    return (
        <div className="brain-regions-container">
            <div className="image-overlay-container">
                <img
                    src={hoveredRegion ? hoveredRegion.image : (side === "outer" ? default_outer.image : default_inner.image)}
                    alt="Brain Regions"
                    className="brain-image"
                    onMouseLeave={() => setHoveredRegion(null)}
                />
                {side === "outer" &&
                    <svg
                        id="outer"
                        className="regions-overlay"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="-2210 -1380 5000 3500"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {Object.entries(regions).map(([key, region]) => (
                            region.side === "outer" &&
                            <polygon
                                key={key}
                                points={region.points}
                                className="region"
                                onMouseEnter={() => handleHover(region)}
                                onClick={() => handleClick(region)}
                                onMouseLeave={() => setHoveredRegion(null)}
                            >
                                <title>{region.name}</title>
                            </polygon>
                        ))}
                    </svg>}
                {side === "inner" &&
                    <svg
                        id="inner"
                        className="regions-overlay"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="-1960 -1290 4500 3366"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {Object.entries(regions).map(([key, region]) => (
                            region.side === "inner" &&
                            <polygon
                                key={key}
                                points={region.points}
                                className="region"
                                onMouseEnter={() => handleHover(region)}
                                onClick={() => handleClick(region)}
                                onMouseLeave={() => setHoveredRegion(null)}
                            >
                                <title>{region.name}</title>
                            </polygon>
                        ))}
                    </svg>}
            </div>
        </div>

    )
};

export default BrainRegions;

BrainRegions.propTypes = {
    disease: PropTypes.string.isRequired,
};