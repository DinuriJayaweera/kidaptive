import { Box } from '@mui/material';

type BadgeType = 'age' | 'difficulty' | 'status';

interface BadgeProps {
  label: string;
  type: BadgeType;
}

export function Badge({ label, type }: BadgeProps) {
  let bgColor = '';
  let textColor = '';

  const normalizedLabel = label.toLowerCase().trim();

  if (type === 'age') {
    if (normalizedLabel.includes('5-6')) {
      bgColor = '#fee2e2'; // red-100
      textColor = '#dc2626'; // red-600
    } else if (normalizedLabel.includes('7-8')) {
      bgColor = '#fef9c3'; // yellow-100
      textColor = '#a16207'; // yellow-700
    } else if (normalizedLabel.includes('9-10')) {
      bgColor = '#dcfce3'; // green-100
      textColor = '#15803d'; // green-700
    } else {
      bgColor = '#f3f4f6'; // gray-100
      textColor = '#374151'; // gray-700
    }
  } else if (type === 'difficulty') {
    if (normalizedLabel === 'easy') {
      bgColor = 'rgba(142, 232, 112, 0.2)'; // #8EE870/20
      textColor = '#2e7d32';
    } else if (normalizedLabel === 'medium') {
      bgColor = 'rgba(255, 204, 53, 0.2)'; // #FFCC35/20
      textColor = '#b26a00';
    } else if (normalizedLabel === 'hard') {
      bgColor = 'rgba(255, 81, 68, 0.2)'; // #FF5144/20
      textColor = '#c62828';
    } else {
      bgColor = '#f3f4f6';
      textColor = '#4b5563';
    }
  } else if (type === 'status') {
    if (normalizedLabel === 'active') {
      bgColor = 'rgba(142, 232, 112, 0.2)'; // #8EE870/20
      textColor = '#2e7d32';
    } else if (normalizedLabel.includes('pending')) {
      bgColor = 'rgba(255, 148, 71, 0.2)'; // #FF9447/20
      textColor = '#b45309';
    } else {
      bgColor = '#f3f4f6';
      textColor = '#4b5563';
    }
  }

  // Pending Review sometimes has string "pending" or "Pending Review"
  const displayLabel = type === 'status' && normalizedLabel === 'pending' ? 'Pending Review' : label;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: '999px',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {displayLabel}
    </Box>
  );
}
