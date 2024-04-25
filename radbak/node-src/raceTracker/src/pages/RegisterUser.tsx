import React from 'react';
import { RegisterUserForm } from '../components/RegisterUser/RegisterUserForm';
import registerUser from '../api/registerUser';

export const Runner: React.FC = () => {
  const handleUserSubmit = async (username: string) => {
    try {
      const result = await registerUser(username);
      alert('User registered successfully!');
    } catch (error) {
      alert('Failed to submit username.');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Enter a username</h2>
      <RegisterUserForm onSubmitUser={handleUserSubmit} />
    </div>
  );
};

export default Runner;
