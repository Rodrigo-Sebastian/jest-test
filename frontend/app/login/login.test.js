import { render, screen, fireEvent } from '@testing-library/react';
import Login from './page';
import { useRouter } from 'next/navigation';
import axios from 'axios'; 

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('axios');

describe('Login Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    useRouter.mockImplementation(() => ({
      push: mockPush, 
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form correctly', () => {
    render(<Login />);
    expect(screen.getByLabelText('Användarnamn')).toBeInTheDocument();
    expect(screen.getByLabelText('Lösenord')).toBeInTheDocument();
  });

  it('displays a message on login error', async () => {
    axios.post.mockImplementationOnce(() =>
      Promise.reject(new Error('Felaktiga inloggningsuppgifter. Försök igen.'))
    );

    render(<Login />);
    
    fireEvent.change(screen.getByLabelText('Användarnamn'), { target: { value: 'wrongUser' } });
    fireEvent.change(screen.getByLabelText('Lösenord'), { target: { value: 'wrongPassword' } });

    fireEvent.click(screen.getByRole('button', { name: /logga in/i }));

    expect(await screen.findByText('Felaktiga inloggningsuppgifter. Försök igen.')).toBeInTheDocument();
  });
});
