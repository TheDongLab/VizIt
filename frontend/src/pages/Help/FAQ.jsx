"use client"

import { useState } from "react"
import {
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  DataObject as DataIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  Code as CodeIcon,
} from "@mui/icons-material"

const faqData = [
  {
    id: "1",
    category: "general",
    question: "What is BrainDataPortal?",
    answer:
      "BrainDataPortal is a comprehensive data portal designed for single-cell, spatial transcriptomics, and other omics data analysis and visualization. It provides researchers with powerful tools to explore, analyze, and visualize complex biological datasets.",
  },
  {
    id: "2",
    category: "data",
    question: "What types of data does the portal support?",
    answer:
      "Our portal supports various omics data types including single-cell RNA sequencing (scRNA-seq), spatial transcriptomics, bulk RNA-seq, ATAC-seq, ChIP-seq, proteomics, and metabolomics data. We accept standard formats like H5AD, CSV, TSV, HDF5, and more.",
  },
  {
    id: "3",
    category: "technical",
    question: "What are the system requirements?",
    answer:
      "BrainDataPortal is web-based and works on modern browsers (Chrome, Firefox, Safari, Edge). For optimal performance, we recommend at least 8GB RAM and a stable internet connection. No software installation is required.",
  },
  {
    id: "4",
    category: "data",
    question: "How do I upload my data?",
    answer:
      "You can upload data through our secure upload interface. Supported formats include H5AD, CSV, Excel, and compressed archives. Files up to 5GB are supported. For larger datasets, please contact our support team for assistance.",
  },
  {
    id: "5",
    category: "general",
    question: "What analysis tools are available?",
    answer:
      "Our platform offers dimensionality reduction (PCA, t-SNE, UMAP), clustering analysis, differential expression analysis, pathway enrichment, cell type annotation, trajectory analysis, and interactive visualization tools.",
  },
  {
    id: "6",
    category: "security",
    question: "Is my data secure?",
    answer: "You will install this software on your own computer/server. We do not store any data on our servers."
  },
  {
    id: "7",
    category: "account",
    question: "How do I create an account?",
    answer:
      'Click the "Sign Up" button on our homepage and fill in your details. You\'ll receive a verification email to activate your account. Institutional accounts and bulk registrations are also available.',
  },
  {
    id: "8",
    category: "technical",
    question: "Can I use the API for programmatic access?",
    answer:
      "Yes, we provide a comprehensive REST API built with FastAPI. You can access data, submit analysis jobs, and retrieve results programmatically. API documentation and Python/R client libraries are available.",
  },
  {
    id: "9",
    category: "data",
    question: "What visualization options are available?",
    answer:
      "We offer interactive scatter plots, heatmaps, violin plots, spatial plots, gene expression overlays, pathway networks, and customizable dashboards. All visualizations are exportable in various formats.",
  },
  {
    id: "10",
    category: "technical",
    question: "How long does data processing take?",
    answer:
      "Processing time depends on dataset size and analysis complexity. Small datasets (< 10,000 cells) typically process in minutes, while larger datasets may take hours. You'll receive email notifications when jobs complete.",
  },
  {
    id: "11",
    category: "general",
    question: "Is there a cost to use the platform?",
    answer:
      "We offer both free and premium tiers. The free tier includes basic analysis tools and limited storage. Premium plans provide advanced features, increased storage, priority processing, and dedicated support.",
  },
  {
    id: "12",
    category: "technical",
    question: "Can I collaborate with other researchers?",
    answer:
      "Yes, our platform supports collaborative workspaces where you can share datasets, analyses, and visualizations with team members. You can set different permission levels and track changes.",
  },
]

const categoryInfo = {
  general: { label: "General", icon: <HelpIcon />, color: "#1976d2" },
  data: { label: "Data & Upload", icon: <DataIcon />, color: "#388e3c" },
  technical: { label: "Technical", icon: <CodeIcon />, color: "#f57c00" },
  security: { label: "Security", icon: <SecurityIcon />, color: "#d32f2f" },
  account: { label: "Account", icon: <HelpIcon />, color: "#7b1fa2" },
}

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Object.keys(categoryInfo)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Frequently Asked Questions
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={4}>
          Find answers to common questions about BrainDataPortal
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label="All"
                onClick={() => setSelectedCategory(null)}
                color={selectedCategory === null ? "primary" : "default"}
                variant={selectedCategory === null ? "filled" : "outlined"}
              />
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={categoryInfo[category].label}
                  onClick={() => setSelectedCategory(category)}
                  color={selectedCategory === category ? "primary" : "default"}
                  variant={selectedCategory === category ? "filled" : "outlined"}
                  icon={categoryInfo[category].icon}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Category Overview Cards */}
      <Grid container spacing={3} mb={4}>
        {categories.map((category) => {
          const count = faqData.filter((faq) => faq.category === category).length
          return (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={category}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-2px)" },
                  border: selectedCategory === category ? 2 : 0,
                  borderColor: categoryInfo[category].color,
                }}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Box sx={{ color: categoryInfo[category].color, mb: 1 }}>{categoryInfo[category].icon}</Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {categoryInfo[category].label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {count} questions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* FAQ Accordions */}
      <Box>
        {filteredFAQs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              No FAQs found matching your search criteria
            </Typography>
          </Paper>
        ) : (
          filteredFAQs.map((faq, index) => (
            <Accordion
              key={faq.id}
              expanded={expanded === faq.id}
              onChange={handleAccordionChange(faq.id)}
              sx={{
                mb: 1,
                "&:before": { display: "none" },
                boxShadow: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                    gap: 2,
                  },
                }}
              >
                <Chip
                  size="small"
                  label={categoryInfo[faq.category].label}
                  sx={{
                    backgroundColor: categoryInfo[faq.category].color,
                    color: "white",
                    minWidth: 100,
                  }}
                />
                <Typography variant="subtitle1" fontWeight="medium">
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Contact Section */}
      <Paper elevation={2} sx={{ p: 4, mt: 6, textAlign: "center", bgcolor: "primary.main", color: "white" }}>
        <Typography variant="h5" gutterBottom>
          Still have questions?
        </Typography>
        <Typography variant="body1" mb={2}>
          {"Can't find what you're looking for? Our support team is here to help."}
        </Typography>
        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          <Typography variant="body2">📧 support@braindataportal.com</Typography>
          <Typography variant="body2">📚 Documentation</Typography>
          <Typography variant="body2">💬 Live Chat</Typography>
        </Box>
      </Paper>
    </Container>
  )
}
