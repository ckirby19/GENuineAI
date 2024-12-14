// src/frontend/components/BackgroundAnimation.tsx
import React from 'react';
import { motion } from 'framer-motion';
  
export const BackgroundAnimation = () => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.1
      }}
    >
      <motion.div
        animate={{
          x: ['0%', '100%', '0%'],
          rotateZ: [0, 360]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          position: 'absolute',
          width: 100,
          height: 100,
          backgroundImage: 'url(/magnifying-glass.svg)'
        }}
      />
      {/* Add more animated faces here */}
    </motion.div>
  );
};
