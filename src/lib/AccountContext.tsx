// src/lib/AccountContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { type Account, getAccount, signOut as clearAccount } from "./account";

type AccountState = {
  account: Account | null;
  setAccount: (a: Account) => void;
  signOut: () => void;
};

const Ctx = createContext<AccountState | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccountState] = useState<Account | null>(getAccount);
  return (
    <Ctx.Provider
      value={{
        account,
        setAccount: setAccountState,
        signOut: () => { clearAccount(); setAccountState(null); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAccount() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAccount must be used inside AccountProvider");
  return v;
}
