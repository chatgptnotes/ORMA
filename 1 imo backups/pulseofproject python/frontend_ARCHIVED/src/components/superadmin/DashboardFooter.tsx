import { Box, Typography } from '@mui/material';

const DashboardFooter = () => {
  return (
    <Box
      sx={{
        width: '100%',
        py: 2,
        px: 3,
        textAlign: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        v1.0 - 2025-11-05
      </Typography>
    </Box>
  );
};

export default DashboardFooter;
