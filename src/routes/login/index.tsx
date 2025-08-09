import { AuthPage } from "@refinedev/antd";
import { useLogin } from "@refinedev/core";
import { Form } from "antd";
import { useEffect } from "react";

type LoginVariables = {
  email: string;
  password: string;
};

export const LoginPage = () => {
  const [form] = Form.useForm<LoginVariables>();
  const { mutate: login } = useLogin<LoginVariables>();

  // Set initial form values when component mounts
  useEffect(() => {
    form.setFieldsValue({
      email: "omniaeid314@gmail.com",
      password: "Oeahna@12",
    });
  }, [form]);

  const handleSubmit = async (values: LoginVariables) => {
    try {
      await login(values);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <AuthPage
      type="login"
      registerLink={false}
      forgotPasswordLink={false}
      title={<h1>Login</h1>}
      formProps={{
        form,
        layout: "vertical",
        onFinish: handleSubmit,
      }}
    />
  );
};
