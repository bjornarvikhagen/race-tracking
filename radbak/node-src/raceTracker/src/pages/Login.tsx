import { ADMIN_PASSWORD } from "../Constants";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = e.currentTarget.password.value;
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin", "true");
      navigate("/");
    } else {
      console.log("Wrong password");
    }
  };

  return (
    <>
      <form onSubmit={handleLogin}>
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <button type="submit">Login</button>
      </form>
    </>
  );
};

export default Login;
