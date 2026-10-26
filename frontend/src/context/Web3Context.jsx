import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  NETWORK_INFO,
  IS_CONFIGURED,
} from "../contractConfig";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [customContractAddress, setCustomContractAddress] = useState(CONTRACT_ADDRESS || "");
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [roles, setRoles] = useState({
    isAdmin: false,
    isManufacturer: false,
    isInspector: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const activeContractAddress = customContractAddress || CONTRACT_ADDRESS;
  const isContractConfigured = Boolean(activeContractAddress && ethers.isAddress(activeContractAddress));

  // Fetch roles for the active connected account
  const refreshRoles = useCallback(async (contractInstance, userAccount) => {
    if (!contractInstance || !userAccount) {
      setRoles({ isAdmin: false, isManufacturer: false, isInspector: false });
      return;
    }
    try {
      const roleResult = await contractInstance.checkRole(userAccount);
      setRoles({
        isAdmin: roleResult.isAdmin || roleResult[0],
        isManufacturer: roleResult.isManufacturer || roleResult[1],
        isInspector: roleResult.isInspector || roleResult[2],
      });
    } catch (err) {
      console.warn("Could not check account roles:", err);
      setRoles({ isAdmin: false, isManufacturer: false, isInspector: false });
    }
  }, []);

  // Initialize read-only provider or attach MetaMask if already permitted
  const initWeb3 = useCallback(async () => {
    try {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        const network = await browserProvider.getNetwork();
        setChainId(Number(network.chainId));
        setNetworkName(network.name);

        const accounts = await browserProvider.listAccounts();
        if (accounts && accounts.length > 0) {
          const activeSigner = await browserProvider.getSigner();
          const activeAccount = await activeSigner.getAddress();
          setAccount(activeAccount);
          setSigner(activeSigner);

          if (isContractConfigured) {
            const contractInst = new ethers.Contract(activeContractAddress, CONTRACT_ABI, activeSigner);
            setContract(contractInst);
            await refreshRoles(contractInst, activeAccount);
          }
        } else if (isContractConfigured) {
          // Read-only contract instance
          const readOnlyContract = new ethers.Contract(activeContractAddress, CONTRACT_ABI, browserProvider);
          setContract(readOnlyContract);
        }
      } else {
        // Fallback to local RPC provider if window.ethereum is absent
        try {
          const fallbackProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
          setProvider(fallbackProvider);
          if (isContractConfigured) {
            const readOnlyContract = new ethers.Contract(activeContractAddress, CONTRACT_ABI, fallbackProvider);
            setContract(readOnlyContract);
          }
        } catch (e) {
          console.warn("Local RPC node not accessible:", e);
        }
      }
    } catch (error) {
      console.error("Failed to initialize web3:", error);
    }
  }, [activeContractAddress, isContractConfigured, refreshRoles]);

  useEffect(() => {
    initWeb3();
  }, [initWeb3]);

  // Handle wallet events (account or chain switch)
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setSigner(null);
        setRoles({ isAdmin: false, isManufacturer: false, isInspector: false });
      } else {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await browserProvider.getSigner();
        const address = await newSigner.getAddress();
        setAccount(address);
        setSigner(newSigner);

        if (isContractConfigured) {
          const contractInst = new ethers.Contract(activeContractAddress, CONTRACT_ABI, newSigner);
          setContract(contractInst);
          await refreshRoles(contractInst, address);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [activeContractAddress, isContractConfigured, refreshRoles]);

  // Explicit user connect function
  const connectWallet = async () => {
    setIsConnecting(true);
    setErrorMessage("");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to interact with BuildChain.");
      }
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const currentSigner = await browserProvider.getSigner();
      const currentAccount = await currentSigner.getAddress();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(currentAccount);
      setChainId(Number(network.chainId));
      setNetworkName(network.name);

      if (isContractConfigured) {
        const contractInst = new ethers.Contract(activeContractAddress, CONTRACT_ABI, currentSigner);
        setContract(contractInst);
        await refreshRoles(contractInst, currentAccount);
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setErrorMessage(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount("");
    setSigner(null);
    setRoles({ isAdmin: false, isManufacturer: false, isInspector: false });
  };

  const updateContractAddress = async (newAddress) => {
    if (!newAddress || !ethers.isAddress(newAddress)) {
      setErrorMessage("Invalid Ethereum contract address format.");
      return false;
    }
    setCustomContractAddress(newAddress);
    try {
      const runner = signer || provider;
      if (runner) {
        const contractInst = new ethers.Contract(newAddress, CONTRACT_ABI, runner);
        setContract(contractInst);
        if (account) {
          await refreshRoles(contractInst, account);
        }
      }
      setErrorMessage("");
      return true;
    } catch (e) {
      setErrorMessage("Failed to attach to the specified contract address.");
      return false;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        contractAddress: activeContractAddress,
        isContractConfigured,
        chainId,
        networkName,
        isConnecting,
        roles,
        errorMessage,
        setErrorMessage,
        connectWallet,
        disconnectWallet,
        updateContractAddress,
        refreshRoles: () => refreshRoles(contract, account),
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
