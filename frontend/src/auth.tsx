import React,{createContext,useContext,useEffect,useState} from 'react';import {api} from './api';
type U={id:string,name:string,email:string,position?:string,roles:string[]};
const C=createContext<any>(null);export const useAuth=()=>useContext(C);
export function AuthProvider({children}:{children:React.ReactNode}){const [user,setUser]=useState<U|null>(()=>JSON.parse(localStorage.getItem('user')||'null')); const login=async(email:string,password:string)=>{const {data}=await api.post('/auth/login',{email,password});localStorage.setItem('token',data.accessToken);localStorage.setItem('user',JSON.stringify(data.user));setUser(data.user)}; const logout=()=>{localStorage.clear();setUser(null)};return <C.Provider value={{user,login,logout}}>{children}</C.Provider>}
