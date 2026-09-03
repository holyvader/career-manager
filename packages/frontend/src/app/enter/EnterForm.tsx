import { Tabs } from '@ds';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function EnterForm() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="d-card w-full max-w-sm bg-base-100 shadow-sm">
        <div className="d-card-body">
          <Tabs
            variant="box"
            grow
            items={[
              { id: 'login', title: 'Log in', content: <LoginForm /> },
              { id: 'register', title: 'Register', content: <RegisterForm /> },
            ]}
            defaultTabId="login"
          />
        </div>
      </div>
    </div>
  );
}
