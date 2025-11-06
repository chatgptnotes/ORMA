import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import Icon from '@mui/material/Icon';
import FileUpload from '../components/FileUpload';
import FileManager from '../components/FileManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`files-tabpanel-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const FilesPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleUploadSuccess = () => {
    setCurrentTab(1);
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          File Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload, organize, and manage your files securely
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Icon>cloud_upload</Icon>
                  <span>Upload Files</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Icon>folder</Icon>
                  <span>My Files</span>
                </Box>
              }
            />
          </Tabs>

          <Box p={3}>
            <TabPanel value={currentTab} index={0}>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <FileManager />
            </TabPanel>
          </Box>
        </Paper>

        <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
          <Typography variant="caption" color="text.secondary" display="block">
            v1.8 - 2025-11-06
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default FilesPage;
