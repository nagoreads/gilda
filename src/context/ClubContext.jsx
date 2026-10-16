import React, { createContext } from 'react';
import { createClient } from '@supabase/supabase-js';

const defaultUrl = "https://lsbdcmshswcqzitqwfiq.supabase.co";
const defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYmRjbXNoc3djcXppdHF3ZmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjA2MzUsImV4cCI6MjEwNjU5NjYzNX0.n9KPVdYVDQ_l3WtFCO0RVOMdAI_OLKYNLhHdg34EKK0";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (envUrl && envUrl.trim() !== "") ? envUrl.trim() : defaultUrl;
const supabaseKey = (envKey && envKey.trim() !== "") ? envKey.trim() : defaultKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ClubContext = createContext(null);

export function ClubProvider({ children }) {
  return (
    <ClubContext.Provider value={{ supabase }}>
      {children}
    </ClubContext.Provider>
  );
}