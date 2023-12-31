import React from "react";
import TokenDecode from "jwt-decode";
import { Context, JsonWebTokenDecode } from "./auth-context.types";
import { storageClear, storageGet, storageSet } from "../utils/storage";

export const AuthContext = React.createContext<Partial<Context>>({});

const AuthContextProvider = ({ children }) => {
  const [hasLogged, setHasLogged] = React.useState(false);

  /** **************************************** */

  // function

  const login = async (email, password) => {
    my.loading(true);
    try {
      const { data: json } = await my.api.auth.post("auth/login", {
        email,
        password,
      });

      if (json.status === "ok") {
        await storageSet("@token", json.data.token);
        await storageSet("@refresh_token", json.data.refresh_token);
        await storageSet("@has_logged", true);

        setHasLogged(true);
      }
    } catch (error) {
      if (__DEV__) {
        console.error(error);
      }
    } finally {
      my.loading(false);
    }
  };

  const logout = async () => {
    my.loading(true);

    try {
      const { data: json } = await my.api.auth.delete("auth/logout");
      if (json.status === "ok") {
        await storageClear(["@uuid"]);

        setHasLogged(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.error(error);
      }
    } finally {
      my.loading(false);
    }
  };

  const register = async (name, username, email, password) => {
    my.loading(true);
    try {
      const { data: json } = await my.api.auth.post("auth/register", {
        name,
        username,
        email,
        password,
      });

      return json;
    } catch (error) {
      // console.error(error);
    } finally {
      my.loading(false);
    }
  };

  const getToken = async (url) => {
    const token = await storageGet("@token");

    if (token && url !== "auth/refresh-token") {
      const refreshToken = await storageGet("@refresh_token");
      const decodedToken = TokenDecode(token) as JsonWebTokenDecode;
      const currentTimeInSeconds = Date.now() / 1000;

      if (decodedToken.exp < currentTimeInSeconds) {
        const { data: json } = await my.api.auth.post("auth/refresh-token", {
          refresh_token: refreshToken,
        });

        if (json.status === "ok") {
          const newToken = json.data.token;
          await storageSet("@token", newToken);

          return newToken;
        }
      }
    }

    return token;
  };

  /** **************************************** */

  // render

  const value = React.useMemo(
    () => ({
      hasLogged,
      setHasLogged,
      login,
      logout,
      register,
      getToken,
    }),
    [hasLogged]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
