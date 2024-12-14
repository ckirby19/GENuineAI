 // src/frontend/pages/Home.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { BackgroundAnimation } from '../components/BackgroundAnimation';
import { useGameContext } from '../context/GameContext';
 
 const HomeContainer = styled.div`
   display: flex;
   flex-direction: column;
   align-items: center;
   min-height: 100vh;
   padding: 20px;
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 `;
 
 const Title = styled.h1`
   color: white;
   text-align: center;
   font-size: 2rem;
   margin-bottom: 2rem;
 `;
 
 const Button = styled(motion.button)`
   padding: 15px 30px;
   margin: 10px;
   border: none;
   border-radius: 25px;
   background: white;
   color: #764ba2;
   font-size: 1.2rem;
   cursor: pointer;
   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
 `;
 
 export const Home = () => {
   const navigate = useNavigate();
   const { createGame, joinGame } = useGameContext();
 
   const handleCreateGame = async () => {
     const gameId = await createGame();
     navigate(`/lobby/${gameId}`);
   };
 
   const handleJoinGame = () => {
     const gameCode = prompt('Enter game code:');
     if (gameCode) {
       joinGame(gameCode);
       navigate(`/lobby/${gameCode}`);
     }
   };
 
   return (
     <HomeContainer>
       <BackgroundAnimation />
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
       >
         <Title>GENuineAI</Title>
         <motion.p
           style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}
         >
           The game where friends come together to trick each other into thinking they aren't human
         </motion.p>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <Button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={handleCreateGame}
           >
             Create Game
           </Button>
           <Button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={handleJoinGame}
           >
             Join Game
           </Button>
         </div>
       </motion.div>
     </HomeContainer>
   );
 };
 