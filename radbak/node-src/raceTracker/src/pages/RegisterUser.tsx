import React from 'react';
import { RegisterUserForm } from '../components/RegisterUser/RegisterUserForm';
import registerUser from '../api/registerUser';

export const Runner: React.FC = () => {
  const handleUserSubmit = async (name: string) => {
    try {
      const result = await registerUser(name);
      alert('User registered successfully to race');
    } catch (error) {
      alert('Failed to register participant.');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Enter name</h2>
      <RegisterUserForm onSubmitUser={handleUserSubmit} />
    </div>
  );
};

export default Runner;
