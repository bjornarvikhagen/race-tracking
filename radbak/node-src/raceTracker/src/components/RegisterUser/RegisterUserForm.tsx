import React, { useState } from 'react';
import "./RegisterUserForm.css"

interface RegisterUserFormProps {
  onSubmitUser: (username: string) => void;
}

export const RegisterUserForm: React.FC<RegisterUserFormProps> = ({ onSubmitUser }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmitUser(username);
  };

  return (
    <form onSubmit={handleSubmit} className="register-user-form">
      <label htmlFor="name">Name:</label>
      <input
        type="text"
        id="name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
};
