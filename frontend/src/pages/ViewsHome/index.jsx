import {Link} from "react-router-dom"
import {Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Paper} from "@mui/material"
import {Dna, Layers, Grid3X3, ScanSearch, GitCompare} from "lucide-react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHexagonNodes } from '@fortawesome/free-solid-svg-icons'

export default function HomePage() {
    const viewOptions = [
        {
            title: "Gene View",
            description:
                "Explore gene expression patterns and analyze specific genes across different cell types and conditions.",
            icon: <Dna size={48} style={{color: "#10b981"}}/>,
            href: "geneview",
        },
        {
            title: "Visium ST View",
            description:
                "Analyze spatial transcriptomics data with Visium technology for tissue-wide gene expression patterns.",
            icon: <Grid3X3 size={48} style={{color: "#f43f5e"}}/>,
            href: "visiumview",
        },
        {
            title: "xQTL View",
            description: "Investigate quantitative trait loci associated with gene expression and regulatory mechanisms.",
            icon: <ScanSearch size={48} style={{color: "#06b6d4"}}/>,
            href: "xqtlview",
        },
        {
            title: "Cluster View",
            description: "Visualize and compare different clusters (cell types, layers, etc.), their markers, and distribution across samples.",
            icon: <FontAwesomeIcon icon={faHexagonNodes} style={{color: "#3b82f6"}} size={"3x"} />,
            href: "clusters",
        },
        // {
        //     title: "Layer View",
        //     description:
        //         "Examine tissue layers and their composition with detailed visualization of layer-specific features.",
        //     icon: <Layers size={48} style={{color: "#f59e0b"}}/>,
        //     href: "layersview",
        // },
        {
            title: "XCheck View",
            description: "Cross-check and compare data across different modalities, samples, or experimental conditions.",
            icon: <GitCompare size={48} style={{color: "#8b5cf6"}}/>,
            href: "xcheck",
        },
    ]

    return (
        <Paper sx={{minHeight: "100vh", py: 5, backgroundColor: "#f5f5f5"}}>
            <Container maxWidth="lg">
                <Box sx={{textAlign: "center", mb: 6}}>
                    <Typography variant="h3">
                        {import.meta.env.VITE_APP_TITLE} Views
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{maxWidth: 700, mx: "auto"}}>
                        Explore and analyze single-cell, spatial transcriptomics, and other omics data through
                        specialized views
                    </Typography>
                </Box>

                <Grid container spacing={4} alignItems="stretch">
                    {viewOptions.map((option, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index} sx={{display: "flex"}}>
                            <Card
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "all 0.3s",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    boxShadow: 1,
                                    "&:hover": {
                                        boxShadow: 8,
                                        transform: "translateY(-3px)",
                                    },
                                }}
                            >
                                <CardContent
                                    sx={{flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", p: 2,}}>
                                    <Box sx={{mb: 0, display: "flex", justifyContent: "center", alignItems: "center", width: 80, height: 80, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.04)",}}>
                                        {option.icon}
                                    </Box>
                                    <Typography variant="h5" component="h2" gutterBottom sx={{fontWeight: 600, mb: 1,}}>
                                        {option.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
                                        {option.description}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{p: 2, pt: 0}}>
                                    <Button
                                        component={Link}
                                        to={option.href}
                                        variant="contained"
                                        fullWidth
                                        size="medium"
                                        style={{backgroundColor: "#2f2f2f", color: "#fff"}}
                                        sx={{
                                            borderRadius: 1,
                                            py: 1,
                                            textTransform: "none",
                                            fontSize: "1rem",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Explore {option.title}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Paper>
    )
}
