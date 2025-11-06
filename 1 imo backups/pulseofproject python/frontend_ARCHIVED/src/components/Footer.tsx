import { Box, Typography } from '@mui/material';

const Footer = () => {
  const version = '1.0';
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        display="block"
        sx={{ fontSize: '0.75rem' }}
      >
        v{version} - {date}
      </Typography>
    </Box>
  );
};

export default Footer;
