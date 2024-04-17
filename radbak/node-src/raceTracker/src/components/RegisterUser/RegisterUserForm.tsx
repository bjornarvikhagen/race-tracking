import React, { useState } from 'react';

interface RegisterUserFormProps {
  onSubmitUsername: (username: string) => void;
}

export const RegisterUserForm: React.FC<RegisterUserFormProps> = ({ onSubmitUsername }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmitUsername(username);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="username">Username:</label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
};
