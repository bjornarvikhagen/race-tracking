import React, { useState } from 'react';
import "./RegisterUserForm.css"

interface RegisterUserFormProps {
  onSubmitUser: (name: string) => void;
}

export const RegisterUserForm: React.FC<RegisterUserFormProps> = ({ onSubmitUser }) => {
  const [name, setName] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmitUser(name);
  };

  return (
    <form onSubmit={handleSubmit} className="register-user-form">
      <label htmlFor="name">Name:</label>
      <input
        type="text"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
};
