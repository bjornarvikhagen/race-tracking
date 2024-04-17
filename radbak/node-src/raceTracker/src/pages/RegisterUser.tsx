import React from 'react';
import { RegisterUserForm } from '../components/RegisterUser/RegisterUserForm';
import sendUsername from '../api/registerUser';

export const Runner: React.FC = () => {
  const handleUsernameSubmit = async (username: string) => {
    try {
      const result = await sendUsername(username);
      console.log('Submission successful:', result);
      alert('Username submitted successfully!');
    } catch (error) {
      alert('Failed to submit username.');
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Submit Your Username</h1>
      <RegisterUserForm onSubmitUsername={handleUsernameSubmit} />
    </div>
  );
};

export default Runner;
