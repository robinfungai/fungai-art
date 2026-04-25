import bottleImage from '@/assets/tincture-bottle.jpg';
import React, { useEffect } from 'react';

interface AILabelGeneratorProps {
  protocol: any;
  onLabelGenerated: (imageUrl: string) => void;
}

export const AILabelGenerator: React.FC<AILabelGeneratorProps> = ({
  protocol,
  onLabelGenerated,
}) => {
  useEffect(() => {
    // Just pass the bottle image as-is, we'll overlay text with CSS
    onLabelGenerated(bottleImage);
  }, [protocol.name, onLabelGenerated]);

  return null; // Component does nothing visible
};

export default AILabelGenerator;
