
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, ClientCompany, Provider } from '@/types';

interface AuthContextType {
  user: User | null;
  clientCompany: ClientCompany | null;
  provider: Provider | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, profileData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: '@lmv_users',
  CURRENT_USER: '@lmv_current_user',
  COMPANIES: '@lmv_companies',
  PROVIDERS: '@lmv_providers',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clientCompany, setClientCompany] = useState<ClientCompany | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const currentUserData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      
      if (currentUserData) {
        const userData = JSON.parse(currentUserData);
        console.log('Found stored user:', userData.email, 'Role:', userData.role);
        setUser(userData);

        if (userData.role === 'client') {
          const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
          if (companiesData) {
            const companies = JSON.parse(companiesData);
            const userCompany = companies.find((c: ClientCompany) => c.userId === userData.id);
            if (userCompany) {
              console.log('Found client company:', userCompany.name);
              setClientCompany(userCompany);
            }
          }
        } else if (userData.role === 'provider') {
          const providersData = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
          if (providersData) {
            const providers = JSON.parse(providersData);
            const userProvider = providers.find((p: Provider) => p.userId === userData.id);
            if (userProvider) {
              console.log('Found provider:', userProvider.name);
              setProvider(userProvider);
            }
          }
        }
      } else {
        console.log('No stored user found');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (!usersData) {
        throw new Error('Aucun utilisateur trouvé. Veuillez créer un compte.');
      }

      const users = JSON.parse(usersData);
      console.log('Total users in storage:', users.length);
      
      const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (!foundUser) {
        console.log('User not found or password incorrect');
        throw new Error('Email ou mot de passe incorrect');
      }

      console.log('User found:', foundUser.email, 'Role:', foundUser.role);

      const userToSet: User = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        createdAt: new Date(foundUser.createdAt),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userToSet));
      console.log('User saved to current user storage');
      
      setUser(userToSet);

      if (userToSet.role === 'client') {
        const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
        if (companiesData) {
          const companies = JSON.parse(companiesData);
          const userCompany = companies.find((c: ClientCompany) => c.userId === userToSet.id);
          if (userCompany) {
            console.log('Client company loaded:', userCompany.name);
            setClientCompany(userCompany);
          }
        }
      } else if (userToSet.role === 'provider') {
        const providersData = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
        if (providersData) {
          const providers = JSON.parse(providersData);
          const userProvider = providers.find((p: Provider) => p.userId === userToSet.id);
          if (userProvider) {
            console.log('Provider loaded:', userProvider.name);
            setProvider(userProvider);
          }
        }
      }

      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, role: UserRole, profileData: any) => {
    try {
      console.log('Registering:', email, role);
      
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      
      const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        throw new Error('Un compte avec cet email existe déjà');
      }

      const newUser: User & { password: string } = {
        id: Date.now().toString(),
        email,
        password,
        role,
        createdAt: new Date(),
      };
      
      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      console.log('User saved to users storage');

      const userToSet: User = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userToSet));
      console.log('User saved to current user storage');
      
      setUser(userToSet);

      if (role === 'client') {
        const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
        const companies = companiesData ? JSON.parse(companiesData) : [];
        
        const newCompany: ClientCompany = {
          id: Date.now().toString(),
          userId: newUser.id,
          ...profileData,
        };
        
        companies.push(newCompany);
        await AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
        console.log('Client company saved:', newCompany.name);
        setClientCompany(newCompany);
      } else if (role === 'provider') {
        const providersData = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
        const providers = providersData ? JSON.parse(providersData) : [];
        
        const newProvider: Provider = {
          id: Date.now().toString(),
          userId: newUser.id,
          averageRating: 0,
          totalRatings: 0,
          ...profileData,
        };
        
        providers.push(newProvider);
        await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
        console.log('Provider saved:', newProvider.name);
        setProvider(newProvider);
      }

      console.log('Registration successful! User created:', email);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setUser(null);
      setClientCompany(null);
      setProvider(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      console.log('Updating profile:', data);
      
      if (user?.role === 'client' && clientCompany) {
        const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
        if (companiesData) {
          const companies = JSON.parse(companiesData);
          const updatedCompanies = companies.map((c: ClientCompany) =>
            c.id === clientCompany.id ? { ...c, ...data } : c
          );
          await AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies));
          setClientCompany({ ...clientCompany, ...data });
          console.log('Client company updated');
        }
      } else if (user?.role === 'provider' && provider) {
        const providersData = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
        if (providersData) {
          const providers = JSON.parse(providersData);
          const updatedProviders = providers.map((p: Provider) =>
            p.id === provider.id ? { ...p, ...data } : p
          );
          await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(updatedProviders));
          setProvider({ ...provider, ...data });
          console.log('Provider updated');
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clientCompany,
        provider,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
