export const MushroomWithEnvelope = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mushroom cap as letterbox top */}
    <path 
      d="M25 45C25 35 35 25 50 25C65 25 75 35 75 45C75 50 70 55 65 55H35C30 55 25 50 25 45Z" 
      fill="currentColor" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    {/* Spots on cap */}
    <circle cx="40" cy="40" r="2" fill="white" />
    <circle cx="55" cy="38" r="2" fill="white" />
    <circle cx="45" cy="48" r="1.5" fill="white" />
    
    {/* Mushroom stem as letterbox body */}
    <rect x="40" y="55" width="20" height="25" fill="currentColor" stroke="currentColor" strokeWidth="2" rx="2" />
    
    {/* Letterbox slot */}
    <rect x="42" y="62" width="16" height="3" fill="white" rx="1" />
    
    {/* Letter sticking out of slot */}
    <rect x="50" y="60" width="12" height="8" fill="white" stroke="currentColor" strokeWidth="1" rx="1" />
    <path d="M50 60 L56 64 L62 60" stroke="currentColor" strokeWidth="1" fill="none" />
    
    {/* Small flag on letterbox */}
    <rect x="60" y="58" width="8" height="4" fill="white" stroke="currentColor" strokeWidth="1" />
    <line x1="60" y1="58" x2="60" y2="70" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const MushroomWithRoots = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mushroom cap */}
    <path 
      d="M25 45C25 35 35 25 50 25C65 25 75 35 75 45C75 50 70 55 65 55H35C30 55 25 50 25 45Z" 
      fill="currentColor" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    {/* Spots on cap */}
    <circle cx="40" cy="40" r="2" fill="white" />
    <circle cx="55" cy="38" r="2" fill="white" />
    <circle cx="45" cy="48" r="1.5" fill="white" />
    
    {/* Mushroom stem */}
    <rect x="45" y="55" width="10" height="15" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    
    {/* Mycelium roots */}
    <path d="M45 70 Q35 75 30 80 Q25 82 20 85" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M50 70 Q40 78 35 85 Q32 88 28 90" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M55 70 Q60 75 65 80 Q70 82 75 85" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M50 70 Q58 78 62 85 Q65 88 68 90" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M50 70 Q50 78 48 85 Q47 88 45 92" stroke="currentColor" strokeWidth="2" fill="none" />
    
    {/* Small root nodes */}
    <circle cx="30" cy="80" r="1" fill="currentColor" />
    <circle cx="65" cy="80" r="1" fill="currentColor" />
    <circle cx="48" cy="85" r="1" fill="currentColor" />
  </svg>
);

export const MushroomWithHeart = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mushroom cap */}
    <path 
      d="M25 45C25 35 35 25 50 25C65 25 75 35 75 45C75 50 70 55 65 55H35C30 55 25 50 25 45Z" 
      fill="currentColor" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    {/* Spots on cap */}
    <circle cx="40" cy="40" r="2" fill="white" />
    <circle cx="55" cy="38" r="2" fill="white" />
    <circle cx="45" cy="48" r="1.5" fill="white" />
    
    {/* Mushroom stem */}
    <rect x="45" y="55" width="10" height="25" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    
    {/* Heart held up by mushroom */}
    <path 
      d="M68 38C68 35 70 33 73 33C76 33 78 35 78 38C78 35 80 33 83 33C86 33 88 35 88 38C88 42 83 47 78 52C73 47 68 42 68 38Z" 
      fill="currentColor" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    
    {/* Arm holding heart */}
    <path d="M55 60 Q65 50 70 45" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);