import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CardMedia,
  CardActions,
} from '@mui/material';
import { Grid } from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Web as WebIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';

interface LandingPage {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: 'published' | 'draft';
  thumbnail: string;
  created_at: string;
}

const LandingPages = () => {
  const [pages, setPages] = useState<LandingPage[]>([
    {
      id: 1,
      title: 'Main Landing Page',
      slug: 'home',
      description: 'Primary landing page for the application',
      status: 'published',
      thumbnail: 'https://via.placeholder.com/300x200',
      created_at: '2025-11-01',
    },
    {
      id: 2,
      title: 'Product Features',
      slug: 'features',
      description: 'Showcase product features and benefits',
      status: 'published',
      thumbnail: 'https://via.placeholder.com/300x200',
      created_at: '2025-11-02',
    },
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    description: '',
  });

  const handleAddPage = () => {
    const page: LandingPage = {
      id: Date.now(),
      title: newPage.title,
      slug: newPage.slug,
      description: newPage.description,
      status: 'draft',
      thumbnail: 'https://via.placeholder.com/300x200',
      created_at: new Date().toISOString().split('T')[0],
    };
    setPages([...pages, page]);
    setOpenDialog(false);
    setNewPage({ title: '', slug: '', description: '' });
  };

  const handleDelete = (id: number) => {
    setPages(pages.filter(p => p.id !== id));
  };

  return (
    <DashboardLayout userRole="superadmin">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Landing Pages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage landing pages for your website
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <WebIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">{pages.length}</Typography>
                <Typography variant="body2">Total Pages</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
              <CardContent>
                <ViewIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {pages.filter(p => p.status === 'published').length}
                </Typography>
                <Typography variant="body2">Published</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Create Landing Page
          </Button>
        </Box>

        {/* Landing Pages Grid */}
        <Grid container spacing={3}>
          {pages.map((page) => (
            <Grid xs={12} sm={6} md={4} key={page.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={page.thumbnail}
                  alt={page.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {page.title}
                    </Typography>
                    <Chip
                      label={page.status}
                      color={page.status === 'published' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    /{page.slug}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {page.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                    Created: {new Date(page.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" color="primary">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(page.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Add Page Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Create New Landing Page
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              fullWidth
              label="Page Title"
              value={newPage.title}
              onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="URL Slug"
              value={newPage.slug}
              onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
              sx={{ mb: 2 }}
              helperText="URL path for this page (e.g., features, pricing)"
            />
            <TextField
              fullWidth
              label="Description"
              value={newPage.description}
              onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddPage}
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Create Page
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default LandingPages;
