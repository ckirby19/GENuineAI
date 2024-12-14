  // src/frontend/components/AnswerInput.tsx
import React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
  
  const Input = styled.input`
    width: 100%;
    padding: 15px;
    border: 2px solid #764ba2;
    border-radius: 10px;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  `;

  const Button = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #357abd;
  }
`;
  
  interface AnswerInputProps {
    onSubmit: (answer: string) => void;
  }
  
  export const AnswerInput = ({ onSubmit }: AnswerInputProps) => {
    const [answer, setAnswer] = useState('');
  
    const handleSubmit = () => {
      if (answer.trim()) {
        onSubmit(answer);
        setAnswer('');
      }
    };
  
    return (
      <div>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
        />
        <Button onClick={handleSubmit}>Submit Answer</Button>
      </div>
    );
  };