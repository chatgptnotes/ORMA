import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
} from '@mui/material';
import { Grid } from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Domain as DomainIcon,
  CheckCircle as ActiveIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';

interface Subdomain {
  id: number;
  name: string;
  domain: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const Subdomains = () => {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([
    {
      id: 1,
      name: 'App',
      domain: 'app.yourdomain.com',
      status: 'active',
      created_at: '2025-11-01',
    },
    {
      id: 2,
      name: 'Admin',
      domain: 'admin.yourdomain.com',
      status: 'active',
      created_at: '2025-11-02',
    },
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSubdomain, setNewSubdomain] = useState({
    name: '',
    domain: '',
  });

  const handleAddSubdomain = () => {
    const subdomain: Subdomain = {
      id: Date.now(),
      name: newSubdomain.name,
      domain: `${newSubdomain.name.toLowerCase()}.yourdomain.com`,
      status: 'active',
      created_at: new Date().toISOString().split('T')[0],
    };
    setSubdomains([...subdomains, subdomain]);
    setOpenDialog(false);
    setNewSubdomain({ name: '', domain: '' });
  };

  const handleDelete = (id: number) => {
    setSubdomains(subdomains.filter(s => s.id !== id));
  };

  return (
    <DashboardLayout userRole="superadmin">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Subdomain Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage subdomains for your application
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Configure DNS records in your domain provider to point subdomains to your server
        </Alert>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <DomainIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">{subdomains.length}</Typography>
                <Typography variant="body2">Total Subdomains</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
              <CardContent>
                <ActiveIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {subdomains.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="body2">Active Subdomains</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Subdomains Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">All Subdomains</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Add Subdomain
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Domain</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subdomains.map((subdomain) => (
                    <TableRow key={subdomain.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                      <TableCell>{subdomain.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinkIcon sx={{ mr: 1, fontSize: 18 }} />
                          {subdomain.domain}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subdomain.status}
                          color={subdomain.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(subdomain.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(subdomain.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Add Subdomain Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Add New Subdomain
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              fullWidth
              label="Subdomain Name"
              value={newSubdomain.name}
              onChange={(e) => setNewSubdomain({ ...newSubdomain, name: e.target.value })}
              sx={{ mb: 2 }}
              helperText="e.g., app, admin, dashboard"
            />
            <Alert severity="info">
              Subdomain will be: <strong>{newSubdomain.name.toLowerCase()}.yourdomain.com</strong>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddSubdomain}
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Create Subdomain
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default Subdomains;
